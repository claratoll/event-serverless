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

      // Update the ticket count in the database
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

      // Create a new ticket object
      const newTicket = {
        ticketNumber: ticketNr,
        buyDate: new Date().toISOString(),
        isVerified: false,
      };

      // Add the new ticket object to the event's ticketsArray
      selectedEvent.ticketsArray.push(newTicket);

      // Update the event in the database to include the new ticket
      const updateEventWithTicketParams = {
        TableName: 'event-db',
        Key: {
          id: selectedEvent.id,
        },
        UpdateExpression: 'SET ticketsArray = :newTicketsArray',
        ExpressionAttributeValues: {
          ':newTicketsArray': selectedEvent.ticketsArray,
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
    return sendResponse(200, { success: true, event: selectedEvent });
  } else {
    return sendResponse(404, { success: false, message: 'Event not found' });
  }
};
