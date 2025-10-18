// pages/api/actions/tip.ts
import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

const RECIPIENT_ADDRESS = "YOUR_WALLET_ADDRESS_HERE";
const TIP_AMOUNTS = [0.1, 0.5, 1.0];
const TITLE = "☕ Tip Me!";
const DESCRIPTION = "Support my work with SOL";
const IMAGE_URL = "https://ucarecdn.com/7aa98e35-7b72-4b7f-a3e0-cf4e4ea212d6/";

export async function GET(request: Request) {
  const response: ActionGetResponse = {
    icon: IMAGE_URL,
    title: TITLE,
    description: DESCRIPTION,
    label: "Send Tip",
    links: {
      actions: TIP_AMOUNTS.map(amount => ({
        type: "transaction",
        label: `${amount} SOL`,
        href: `/api/actions/tip?amount=${amount}`,
      })),
    },
  };

  return Response.json(response, {
    headers: ACTIONS_CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const amount = parseFloat(url.searchParams.get("amount") || "0.1");

    const body: ActionPostRequest = await request.json();
    const senderPubkey = new PublicKey(body.account);

    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    const recipientPubkey = new PublicKey(RECIPIENT_ADDRESS);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderPubkey,
        toPubkey: recipientPubkey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    transaction.feePayer = senderPubkey;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const response: ActionPostResponse = {
      type: "transaction",
      transaction: transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      }).toString("base64"),
      message: `Thanks for the ${amount} SOL tip! 🙏`,
    };

    return Response.json(response, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (error) {
    return Response.json(
      { error: "Transaction failed" },
      { status: 400, headers: ACTIONS_CORS_HEADERS }
    );
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    headers: ACTIONS_CORS_HEADERS,
  });
}
