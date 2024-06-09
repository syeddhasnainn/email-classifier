import type { NextApiRequest, NextApiResponse } from "next";
import { google } from 'googleapis';
import { parse } from 'url';
import cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth2callback' 
  );

  const parsedUrl = parse(req.url as string, true);
  const { code } = parsedUrl.query;

  if (code) {
    try {
      const { tokens } = await oauth2Client.getToken(code as string);

      // Store the access token in cookies
      res.setHeader('Set-Cookie', cookie.serialize('accessToken', tokens.access_token as string, {
        httpOnly: true,
        maxAge: tokens.expiry_date ? (tokens.expiry_date - Date.now()) / 1000 : 3600,
        sameSite: 'lax',
        path: '/',
      }));

      oauth2Client.setCredentials(tokens);

      res.writeHead(302, { Location: '/' });
      res.end();
    } catch (error) {
      console.error('Error during OAuth token exchange:', error);
      res.status(500).json({ error: 'Failed to obtain access token' });
    }
  } else {
    const { accessToken } = req.cookies;

    if (accessToken) {
      try {
        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const response = await gmail.users.messages.list({
          userId: 'me',
          labelIds: ['INBOX'],
          maxResults: 10,
        });

        const messages = response.data.messages;

        if (!messages || messages.length === 0) {
          res.status(404).json({ error: 'No messages found' });
          return;
        }

        const decodedMessages = await Promise.all(messages.map(async (message) => {
          const messageResponse = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',
          });
          console.log('messageResponse:', messageResponse)
          const headers = messageResponse.data.payload.headers;
          const fromHeader = headers.find(header => header.name === 'From');
          const subject = headers.find(header => header.name === 'Subject');
          const sender = fromHeader ? fromHeader.value : 'Unknown sender';

          return {
            id: messageResponse.data.id,
            subject: subject,
            sender: sender,
            snippet: messageResponse.data.snippet,
            fullEmail: messageResponse
          };
        }));

        res.json(decodedMessages);
      } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
      }
    } else {
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      });
      res.json({ url });
    }
  }
}
