const { sendResponse } = require('../../responses/index.js');
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  const getEventId = JSON.parse(event.body);

  const { Items } = await db
    .scan({
      TableName: 'event-db',
    })
    .promise();

  const selectedEvent = Items.find((event) => event.id === getEventId.id);

  if (selectedEvent) {
    if (selectedEvent.tickets > 0) {
      const ticketNr = selectedEvent.tickets;
      const updatedTicketCount = selectedEvent.tickets - 1;

      const updateParams = {
        TableName: 'event-db',
        Key: {
          id: selectedEvent.id,
        },
        UpdateExpression: 'SET tickets = :newCount',
        ExpressionAttributeValues: {
          ':newCount': updatedTicketCount,
        },
      };

      await db.update(updateParams).promise();

      const newTicket = {
        ticketNumber: ticketNr,
        buyDate: new Date().toISOString(),
        isVerified: false,
      };

      selectedEvent.ticketsArray.push(newTicket);

      const updateEventWithTicketParams = {
        TableName: 'event-db',
        Key: {
          id: selectedEvent.id,
        },
        UpdateExpression: 'SET #ta = list_append(#ta, :newTicket)',
        ExpressionAttributeValues: {
          ':newTicket': [newTicket],
        },
        ExpressionAttributeNames: {
          '#ta': 'ticketsArray',
        },
      };
      await db.update(updateEventWithTicketParams).promise();

      return sendResponse(200, {
        success: true,
        message: 'Ticket purchased successfully',
      });
    } else {
      return sendResponse(200, {
        success: true,
        message: 'No tickets available',
      });
    }
  } else {
    return sendResponse(404, { success: false, message: 'Event not found' });
  }
};
