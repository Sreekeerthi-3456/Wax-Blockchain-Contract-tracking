import { JsonRpc } from "eosjs";
import axios from "axios";

const endPoints = [
  "https://wax.greymass.com",
  "https://query.3dkrender.com",
  "https://api.wax.alohaeos.com",
  "https://wax.dapplica.io",
  "https://wax-bp.wizardsguild.one",
  "https://wax-public1.neftyblocks.com",
];

let endpointIndex = 0;
let blockFetchCount = 0;

async function sendToServer(data, attempts = 7) {
  try {
    const res = await axios.post("http://18.60.59.48:3000/portal", data);
    console.log(res.data.message);
    console.log(res.status);
  } catch (error) {
    console.log(error.message);
    if (attempts > 0) {
      console.log("Retrying, Attempts left:", attempts - 1);
      await new Promise((resolve) => setTimeout(resolve, 10000));
      return sendToServer(data, attempts - 1);
    } else {
      console.log("Failed to send data after several attempts.");
    }
  }
}

async function fetchingBlocks(blockNum) {
  const rpc = new JsonRpc(endPoints[endpointIndex], { fetch });
  try {
    const block = await rpc.get_block(blockNum);
    console.log("......................................................");
    console.log("Fetched block:", blockNum, "from", endPoints[endpointIndex]);
    console.log("Block Created at:", block.timestamp);

    for (const element of block.transactions) {
      if (element.trx.transaction) {
        for (const action of element.trx.transaction.actions) {
          const time = Math.floor(new Date(block.timestamp).getTime() / 1000);
          const blockData = {
            tx_hash: element.trx.id,
            blockNumber: blockNum,
            timestamp: time,
            contractName: action.account,
            actionName: action.name,
            sender: action.authorization[0].actor,
            chain: "wax",
          };
          console.log(blockData);
          await sendToServer(blockData);
        }
      }
    }
  } catch (error) {
    console.log("Error fetching block:", blockNum, "from", endPoints[endpointIndex]);
    console.log(error.message);
    endpointIndex = (endpointIndex + 1) % endPoints.length;
    await fetchingBlocks(blockNum);
  }
}

async function waxFetchedBlocks() {
  const rpc = new JsonRpc(endPoints[endpointIndex], { fetch });
  const info = await rpc.get_info();
  let latestBlockNum = info.head_block_num;
  console.log("Latest block number starts at:", latestBlockNum);

  while (true) {
    await fetchingBlocks(latestBlockNum);
    blockFetchCount++;
    if (blockFetchCount >= 5) {
      blockFetchCount = 0;
      endpointIndex = (endpointIndex + 1) % endPoints.length;
    }
    latestBlockNum++;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

waxFetchedBlocks();
