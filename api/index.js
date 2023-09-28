import express from 'express';
import bodyParser from 'body-parser';
const { Client } = require('@notionhq/client');

const app = express();

// Body parser middleware to parse JSON bodies
app.use(bodyParser.json());

// POST route handler
app.post('/create-page', async (req, res) => {
  const { pageTitle, mode, startTime, endTime, parentId, apiToken } = req.body;

    const notion = new Client({
      auth: apiToken, // .envファイルからNotion APIキーを読み込む
    });

    const response = await notion.pages.create({
      parent: { database_id: parentId || process.env.NOTION_DATABASE_ID },
      properties: {
        Name: {
          type: 'title',
          title: [{ type: 'text', text: { content: pageTitle } }],
        },
        Type: {
          type: 'select',
          select: { name: mode || 'デフォルト' },
        },
        'Start Time': {
          type: 'date',
          date: { start: startTime },
        },
        'End Time': {
          type: 'date',
          date: { start: endTime },
        },
      },
    });

    res.send('Response from the server'); // Send a response back

});

export default {
  path: '/api',
  handler: app,
};
