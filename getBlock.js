import { JsonRpc } from "eosjs";
import axios from "axios";

const rpc = new JsonRpc("https://wax.greymass.com", { fetch });
// const rpc = new JsonRpc("http://query.3dkrender.com", { fetch });
// const rpc = new JsonRpc("http://api.wax.alohaeos.com", { fetch });

function blockWaitTime(milliSecond) {
  return new Promise((resolve) => setTimeout(resolve, milliSecond));
}

async function sendToServer(data, attempts = 7) {
  try {
    const res = await axios.post("http://18.60.59.48:3000/portal", data);
    console.log(res.data.message);
    console.log(res.status);
  } catch (error) {
    console.log(error.message);
    if (attempts > 0) {
      console.log("Retrying, Attempts left:", attempts - 1);
      await blockWaitTime(10000);
      return sendToServer(data, attempts - 1);
    } else {
      console.log("Failed to send data after several attempts.");
    }
  }
}

export async function fetchingBlock(blockNum) {
  try {
    const block = await rpc.get_block(blockNum);
    console.log("############################################");
    console.log("Fetched block:", blockNum);
    console.log("Block Created at:", block.timestamp);
    const promises = [];

    for (const element of block.transactions) {
      if (element.trx.transaction) {
        for (const action of element.trx.transaction.actions) {
          const promise = (async () => {
            const time = Math.floor(new Date(block.timestamp).getTime() / 1000);
            const data = {
              tx_hash: element.trx.id,
              blockNumber: blockNum,
              timestamp: time,
              contractName: action.account,
              actionName: action.name,
              sender: action.authorization[0].actor,
              chain: "wax",
            };
            console.log(data);
            await sendToServer(data);
          })();
          promises.push(promise);
        }
      }
    }
    await Promise.all(promises);
  } catch (error) {
    console.log(error.message);
  }
}

async function fetchedBlocks(latestBlockNum) {
  if (!latestBlockNum) {
    const info = await rpc.get_info();
    latestBlockNum = info.head_block_num;
    console.log("Latest block number starts at:", latestBlockNum);
  }
  console.log("Fetching block:", latestBlockNum);
  await fetchingBlock(latestBlockNum);
  setTimeout(() => fetchedBlocks(latestBlockNum + 1), 5000);
}

fetchedBlocks();
