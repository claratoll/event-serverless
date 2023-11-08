const { sendResponse } = require('../../responses/index.js');
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

async function getTicket(ticketId) {
  /*ticket = await db.get({
    TableName
    ticketId
    något nyckel
  })*/
}

async function verify(ticketId) {
  //updatera ticket.verify(true)
  //kolla hur det ser ut på dog-serverless
}

exports.handler = async (event, context) => {
  const { ticketId } = JSON.parse(event.body);

  const ticket = await getTicket(ticketId);

  if (!ticket) return sendResponse(error);

  await verify(ticketId);

  const { Items } = await db
    .scan({
      TableName: 'event-db',
    })
    .promise();

  return sendResponse(200, { success: true, event: Items });
};
