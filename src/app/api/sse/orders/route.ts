import { NextRequest } from 'next/server';
import { sseManager, SSE_CHANNELS } from '@/lib/sse';
import { v4 as uuidv4 } from 'uuid';

// GET /api/sse/orders - SSE stream for realtime order updates
export async function GET(request: NextRequest) {
  const channel = request.nextUrl.searchParams.get('channel') || SSE_CHANNELS.STAFF_ORDERS;
  const clientId = uuidv4();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`));

      // Register client
      sseManager.addClient(clientId, controller, channel);

      // Keep alive every 30 seconds
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepAlive);
          sseManager.removeClient(clientId);
        }
      }, 30000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        sseManager.removeClient(clientId);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
