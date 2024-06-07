import { google } from 'googleapis';
import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'url';

export default async function handler(req: any, res: NextApiResponse) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth2callback' 
  );
  
  const parsedUrl = parse(req.url, true);
  const { code } = parsedUrl.query;

  const { tokens } = await oauth2Client.getToken(code as string);
  
  oauth2Client.setCredentials({
    refresh_token: tokens.refresh_token,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
    });

    const messages = response.data.messages;
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
}
