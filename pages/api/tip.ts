// pages/api/actions/tip.ts
import type { NextApiRequest, NextApiResponse } from 'next';
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

const RECIPIENT_ADDRESS = "9dwN17bHPriRGwgGQKSoMDAKZXnycjHrnEeJm6MKvkue";
const TIP_AMOUNTS = [0.1, 0.5, 1.0];
const TITLE = "☕ Tip Me!";
const DESCRIPTION = "Support my work with SOL";
const IMAGE_URL = "https://ucarecdn.com/7aa98e35-7b72-4b7f-a3e0-cf4e4ea212d6/";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers for all responses
  Object.entries(ACTIONS_CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'GET') {
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

    return res.status(200).json(response);
  }

  if (req.method === 'POST') {
    try {
      const { amount } = req.query;
      const tipAmount = parseFloat(amount as string || "0.1");

      const body: ActionPostRequest = req.body;
      const senderPubkey = new PublicKey(body.account);

      const connection = new Connection(clusterApiUrl("mainnet-beta"));
      const recipientPubkey = new PublicKey(RECIPIENT_ADDRESS);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderPubkey,
          toPubkey: recipientPubkey,
          lamports: tipAmount * LAMPORTS_PER_SOL,
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
        message: `Thanks for the ${tipAmount} SOL tip! 🙏`,
      };

      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ error: "Transaction failed" });
    }
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
