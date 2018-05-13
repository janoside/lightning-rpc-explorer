# Lightning RPC Explorer

Simple, database-free Lightning network explorer, via RPC. Built with Node.js, express, bootstrap-v4.

This tool is intended to be a simple, self-hosted explorer for the Lightning network, driven by RPC calls to your own lightning node.

A live demo of the tool is available at https://lightning.chaintools.io

# Features

* Network summary
* Browse nodes and channels, sorted by last update or capacity
* View node and channel details
* Search by node or channel

# Getting started

The below instructions are geared toward BTC, but can be adapted easily to other coins.

## Prerequisites

1. Install and run a full, archiving node - [instructions](https://bitcoin.org/en/full-node). Ensure that your node has full transaction indexing enabled (`txindex=1`) and the RPC server enabled (`server=1`).
2. Synchronize your node with the Bitcoin network.

## Instructions

1. Clone this repo
2. `npm install` to install all required dependencies
3. Optional: Uncomment the "bitcoind" section in [env.js](app/env.js) to automatically connect to the target node.
4. Optional: Change the "coin" value in [env.js](app/env.js). Currently supported values are "BTC" and "LTC".
5. `npm start` to start the local server
6. Navigate to http://127.0.0.1:3002/
7. Connect using the RPC credentials for your target bitcoin node (if you didn't edit [env.js](app/env.js) in Step 3)

# Screenshots

<table>
  <tr>
    <td valign="top">
      <h4>Connect via RPC</h4>
      <hr/>
      <img src="public/img/screenshots/connect.png" style="margin-right:5px; border: 1px solid #ccc;" />
    </td>
    <td valign="top">
      <h4>Homepage (list of recent blocks)</h4>
      <hr/>
      <img src="public/img/screenshots/home.png" style="margin-right:5px; border: 1px solid #ccc;" />
    </td>
    <td valign="top">
      <h4>Node Details</h4>
      <hr/>
      <img src="public/img/screenshots/node-details.png" style="margin-right:5px; border: 1px solid #ccc;" />
    </td>
  </tr>
  <tr>
    <td valign="top">
      <h4>Browse Blocks</h4>
      <hr/>
      <img src="public/img/screenshots/blocks.png" style="margin-right:5px; border: 1px solid #ccc;" />
    </td>
    <td valign="top">
      <h4>Block Details</h4>
      <hr/>
      <img src="public/img/screenshots/block.png" style="margin-right:5px; border: 1px solid #ccc;" />
    </td>
    <td valign="top">
      <h4>Mempool Summary</h4>
      <hr/>
      <img src="public/img/screenshots/mempool-summary.png" style="margin-right:5px; border: 1px solid #ccc;" />
    </td>
  </tr>
  <tr>
    <td valign="top">
      <h4>Transaction Details</h4>
      <hr/>
      <img src="public/img/screenshots/transaction.png" style="margin-right:5px; border: 1px solid #ccc;" />
    </td>
    <td valign="top">
      <h4>Transaction, Raw JSON</h4>
      <hr/>
      <img src="public/img/screenshots/transaction-raw.png" style="margin-right:5px; border: 1px solid #ccc;" />
    </td>
    <td valign="top">
      <h4>RPC Browser</h4>
      <hr/>
      <img src="public/img/screenshots/rpc-browser.png" style="margin-right:5px; border: 1px solid #ccc;" />
    </td>
  </tr>
</table>

# Donate

To support continued development of this tool and/or to support the hosting of the live demo site:

* [Bitcoin](bitcoin:3NPGpNyLLmVKCEcuipBs7G4KpQJoJXjDGe): 3NPGpNyLLmVKCEcuipBs7G4KpQJoJXjDGe
* [Litecoin](litecoin:ME4pXiXuWfEi1ANBDo9irUJVcZBhsTx14i): ME4pXiXuWfEi1ANBDo9irUJVcZBhsTx14i

