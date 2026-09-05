// ============================================
// SSE (Server-Sent Events) Manager
// ============================================
// Manages SSE connections for realtime updates

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
  channel: string;
};

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();

  addClient(id: string, controller: ReadableStreamDefaultController, channel: string) {
    this.clients.set(id, { id, controller, channel });
  }

  removeClient(id: string) {
    this.clients.delete(id);
  }

  broadcast(channel: string, event: string, data: unknown) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);

    this.clients.forEach((client) => {
      if (client.channel === channel) {
        try {
          client.controller.enqueue(encoded);
        } catch {
          // Client disconnected, clean up
          this.removeClient(client.id);
        }
      }
    });
  }

  getClientCount(channel?: string): number {
    if (!channel) return this.clients.size;
    return Array.from(this.clients.values()).filter((c) => c.channel === channel).length;
  }
}

// Singleton instance
const globalForSSE = globalThis as unknown as {
  sseManager: SSEManager | undefined;
};

export const sseManager = globalForSSE.sseManager ?? new SSEManager();

if (process.env.NODE_ENV !== 'production') globalForSSE.sseManager = sseManager;

// SSE Channel names
export const SSE_CHANNELS = {
  STAFF_ORDERS: 'staff-orders',
  STAFF_CALLS: 'staff-calls',
  CUSTOMER_ORDERS: 'customer-orders',
} as const;

// SSE Event names
export const SSE_EVENTS = {
  NEW_ORDER: 'new_order',
  ORDER_UPDATED: 'order_updated',
  NEW_STAFF_CALL: 'new_staff_call',
  STAFF_CALL_UPDATED: 'staff_call_updated',
  ORDER_STATUS_CHANGED: 'order_status_changed',
} as const;
