import { clerkClient,getAuth,  } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import {google} from 'googleapis'
import { get } from "http";

 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    console.log('CLIENT_ID:',process.env.GOOGLE_CLIENT_ID)
    console.log('CLIENT_SECRET:',process.env.GOOGLE_CLIENT_SECRET)

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'http://localhost:3000/example'
      );

      const { getToken } = getAuth(req);
      const userToken  = await getToken();

      // const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

      // const url = oauth2Client.generateAuthUrl({
      //   access_type: 'offline',
      //   scope: scopes,
      // });
      
      // console.log('Authorize this app by visiting this url:', url);
      const auth_code='4/0ATx3LY5LD5fHOMDCmUM69PKXfJPaNuZxdiKzV2Ob7vda2j5_0wWUJeW3SP2T3tspXi0hGA'
      // async function getTokens() {
      //   const { tokens } = await oauth2Client.getToken(auth_code);
      //   console.log('Access Token:', tokens.access_token);
      //   console.log('Refresh Token:', tokens.refresh_token);
      // }

      oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN,
      });

      try {
        // Refresh the access token
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
    //     const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        
    //     try {
    //         const response = await gmail.users.messages.list({
    //           userId: 'me',
    //           maxResults: 10,
    //         });
        
    //         const messages = response.data.messages;
        
    //         res.status(200).json(messages);
    //       } catch (error) {
    //         console.error('Error fetching emails:', error);
    //         res.status(500).json({ error: 'Failed to fetch emails' });
    //       }
  return res.status(200).json({});
}