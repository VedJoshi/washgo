import type { ToolDefinition } from './client'

export const findNearbyServicesTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'findNearbyServices',
    description:
      'Find nearby car service garages and car washes based on location and service type. Returns up to 5 results sorted by distance and rating.',
    parameters: {
      type: 'object',
      properties: {
        serviceType: {
          type: 'string',
          description: 'Type of service needed: car_wash, car_repair, oil_change, battery, tire_rotation, brake_service, diagnostic',
          enum: ['car_wash', 'car_repair', 'oil_change', 'battery', 'tire_rotation', 'brake_service', 'diagnostic'],
        },
        lat: {
          type: 'number',
          description: 'User latitude',
        },
        lng: {
          type: 'number',
          description: 'User longitude',
        },
        radiusKm: {
          type: 'number',
          description: 'Search radius in kilometers',
          default: 5,
        },
      },
      required: ['serviceType', 'lat', 'lng'],
    },
  },
}

export const getVehicleStatusTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getVehicleStatus',
    description:
      'Get the current vehicle status including health score, odometer, and last service date.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
}

export const getServiceQuoteTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getServiceQuote',
    description:
      'Get a detailed price quote for a specific service at a specific garage. Returns line items in VND.',
    parameters: {
      type: 'object',
      properties: {
        garageId: {
          type: 'string',
          description: 'ID of the garage',
        },
        serviceType: {
          type: 'string',
          description: 'Type of service to quote',
        },
      },
      required: ['garageId', 'serviceType'],
    },
  },
}

export const bookServiceTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'bookService',
    description:
      'Book a service appointment at a garage. Returns a booking confirmation with confirmation code.',
    parameters: {
      type: 'object',
      properties: {
        garageId: {
          type: 'string',
          description: 'ID of the garage to book at',
        },
        serviceType: {
          type: 'string',
          description: 'Type of service to book',
        },
        slotLabel: {
          type: 'string',
          description: 'Preferred time slot (e.g., "Saturday 9:00 AM")',
        },
      },
      required: ['garageId', 'serviceType', 'slotLabel'],
    },
  },
}

export const getBookingStatusTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getBookingStatus',
    description:
      'Check the current status of a booking by its ID.',
    parameters: {
      type: 'object',
      properties: {
        bookingId: {
          type: 'string',
          description: 'The booking confirmation code',
        },
      },
      required: ['bookingId'],
    },
  },
}

export const allTools: ToolDefinition[] = [
  findNearbyServicesTool,
  getVehicleStatusTool,
  getServiceQuoteTool,
  bookServiceTool,
  getBookingStatusTool,
]
