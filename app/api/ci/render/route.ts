import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // 1. Validate the request json
  // 2. See if a render is already in progress
  // 3. Send a render request
  // 4. Return pollingId
}
