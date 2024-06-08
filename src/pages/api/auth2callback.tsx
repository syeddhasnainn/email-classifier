import type { NextApiRequest, NextApiResponse } from "next";
import { google } from 'googleapis';
import { parse } from 'url';
import cookie from 'cookie';

export default async function handler(req: any, res: NextApiResponse) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth2callback'
  );

  // Parse the URL to check for the 'code' parameter
  const parsedUrl = parse(req.url, true);
  const { code } = parsedUrl.query;

  if (code) {
    try {
      const { tokens } = await oauth2Client.getToken(code as string);

      // Store the access token in cookies
      res.setHeader('Set-Cookie', cookie.serialize('accessToken', tokens.access_token as string, {
        httpOnly: true,
        maxAge: tokens.expiry_date ? (tokens.expiry_date - Date.now()) / 1000 : 3600, // Set max age based on token expiry
        sameSite: 'lax',
        path: '/',
      }));

      oauth2Client.setCredentials({ access_token: tokens.access_token, refresh_token: tokens.refresh_token });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
      });

      const messages = response.data.messages;

      if (!messages || messages.length === 0) {
        res.status(404).json({ error: 'No messages found' });
        return;
      }

      res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching emails:', error);
      res.status(500).json({ error: 'Failed to fetch emails' });
    }
  } else {
    // Check if the user is already authenticated
    const { accessToken } = req.cookies;

    if (accessToken) {
      // User is already logged in, fetch emails
      try {
        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const response = await gmail.users.messages.list({
          userId: 'me',
          maxResults: 10,
        });

        const messages = response.data.messages;

        if (!messages || messages.length === 0) {
          res.status(404).json({ error: 'No messages found' });
          return;
        }

        res.status(200).json(messages);
      } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
      }
    } else {
      // User is not logged in, redirect them to Google OAuth2 login
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      });
      res.redirect(url);
    }
  }
}
