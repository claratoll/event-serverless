const { sendResponse } = require('../../responses/index.js');
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

async function getTicket(ticketId) {
  try {
    const response = await db
      .get({
        TableName: 'event-db',
        Key: { id: ticketId },
      })
      .promise();

    return response.Item;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return null;
  }
}

async function verify(ticketId, index) {
  try {
    await db
      .update({
        TableName: 'event-db',
        Key: { id: ticketId },
        UpdateExpression: `SET ticketsArray[${index}].isVerified = :isVerified`,
        ExpressionAttributeValues: {
          ':isVerified': true,
        },
      })
      .promise();
  } catch (error) {
    console.error('Error updating ticket:', error);
  }
}

exports.handler = async (event, context) => {
  const { id, ticketNumber } = JSON.parse(event.body);

  const ticket = await getTicket(id);

  if (!ticket) {
    return sendResponse(404, { message: 'Ticket not found' });
  }

  const matchingTicketIndex = ticket.ticketsArray.findIndex(
    (t) => t.ticketNumber === ticketNumber
  );

  if (matchingTicketIndex !== -1) {
    if (!ticket.ticketsArray[matchingTicketIndex].isVerified) {
      await verify(ticket.id, matchingTicketIndex);
      return sendResponse(200, { success: true, message: 'Ticket verified' });
    } else {
      return sendResponse(403, {
        success: true,
        message: 'Ticket already verified, please buy your own ticket.',
      });
    }
  } else {
    return sendResponse(403, { message: 'Invalid ticket number' });
  }
};
