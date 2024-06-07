import type { NextApiRequest, NextApiResponse } from "next";
import {google} from 'googleapis'
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'http://localhost:3000/api/auth2callback'
      );

      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      });

      res.redirect(url);

  return res.status(200).json({});
}