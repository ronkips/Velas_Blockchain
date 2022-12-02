import React, { useEffect, useState } from "react";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import { ethers } from "ethers";
import contractAbi from "./domain.json";
import ethLogo from "./assets/ethlogo.png";
import velasLogo from "./assets/velas-logo.png";
import { networks } from "./utils/networks";

// Constants
const TWITTER_HANDLE = "ronkips01";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// adding domains we will minting
const tld = ".VLX";
const CONTRACT_ADDRESS = "0xfe9938d3A0a888A07B9820AC5d68dddEf5c03cC7";

const App = () => {
  //state variable  to store our user's public wallet.
  const [currentAccount, setCurrentAccount] = useState("");

  // static data properties
  const [editing, setEditing] = useState(false);
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState("");
  const [network, setNetwork] = useState("");
  const [mints, setMints] = useState([]);

  //static

  // connnect wallet

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask please 🤝-> https://metamask.io/");
        return;
      }
      // A great way to call a method to request access to account.
      const accounts = await ethereum.request({
        method: "eth_requestAccounts"
      });

      // Boom! This should print out public address once we authorize Metamask.
      console.log("Connected:", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log("There was an error connecting to the metamask", error);
    }
  };

  // const numberToHex = (num) => {
  //   const val = Number(num);
  //   return "0x" + val.toString(16);
  // };
  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        // Try to switch to the Velas testnet
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x6f" }]
        });
      } catch (error) {
        // This error code means that the chain we want has not been added to MetaMask
        // In this case we ask the user to add it to their MetaMask
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x6f",
                  chainName: "Velas Testnet",
                  rpcUrls: ["https://explorer.testnet.velas.com/rpc"],
                  nativeCurrency: {
                    name: "Velas Testnet",
                    symbol: "ELT",
                    decimals: 18
                  },
                  blockExplorerUrls: ["https://explorer.testnet.velas.com/"]
                }
              ]
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      // If window.ethereum is not found then MetaMask is not installed
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  const checkIfWalletIsConnected = async () => {
    //making sure we have accessed to window.ethereum
    const { ethereum } = window;

    if (!ethereum) {
      console.log("make sure you have metamask installed");

      return;
    } else {
      console.log("Hey, we have the ethereum object", ethereum);
    }
    //check if we are authorized to access user's wallet
    const accounts = await ethereum.request({
      method: "eth_requestAccounts"
    });

    // Users can have multiple authorized accounts, we grab the first one if its there!
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("Sorry, no authorized account found");
    }
    // This is the new part, we check the user's network chain ID
    const chainId = await ethereum.request({ method: "eth_chainId" });
    setNetwork(networks[chainId]);

    ethereum.on("chainChanged", handleChainChanged);

    // Reload the page when they change networks
    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  };

  const mintDomain = async () => {
    // Don't run if the domain is empty
    if (!domain) {
      return;
    }
    // Alert the user if the domain is too short
    if (domain.length < 3) {
      alert("sorry domain must be at least 3 characters long");
      return;
    }
    // Calculate price based on length of domain (change this to match your contract)
    const price =
      domain.length === 3 ? "0.005" : domain.length === 4 ? "0.003" : "0.001";
    console.log("Minting domain", domain, "with a price of", price, "ELt");
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        console.log("==Hey going to pop up wallet now to pay the gas...");
        let tx = await contract.register(domain, {
          value: ethers.utils.parseEther(price)
        });
        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        // Checking if the transaction was successfully completed
        if (receipt.status === 1) {
          console.log(
            "Domain minted!: https://evmexplorer.testnet.velas.com/tx/" +
              tx.hash
          );

          // Set the record for the domain
          tx = await contract.setRecord(domain, record);
          await tx.wait();

          console.log(
            "Record set!: https://evmexplorer.testnet.velas.com/tx/" + tx.hash
          );

          // call fetchMint after 2 secs
          setTimeout(() => {
            fetchMints();
          }, 2000);

          setRecord("");
          setDomain("");
        } else {
          alert("Sorrry transaction failed! Please try again");
        }
      }
    } catch (error) {
      console.log("wah.. Sa utado???", error);
    }
  };

  //fetching all the mints
  const fetchMints = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        // Get all the domain names from our contract
        const names = await contract.getAllNames();
        // console.log("Names:", names);

        // For each name, get the record and the address
        const mintRecords = await Promise.all(
          names.map(async (name) => {
            const mintRecord = await contract.records(name);
            const owner = await contract.domains(name);
            return {
              id: names.indexOf(name),
              name: name,
              record: mintRecord,
              owner: owner
            };
          })
        );

        console.log("MINTS FETCHED =: ", mintRecords);
        setMints(mintRecords);
      }
    } catch (error) {
      console.log("Wah??? Yo got an error", error);
    }
  };

  // updating domain
  const updateDomain = async () => {
    if (!record || !domain) {
      return;
    }
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        let tx = await contract.setRecord(domain, record);
        await tx.wait();
        console.log(
          "Record set ttps://explorer.testnet.velas.com/tx/" + tx.hash
        );

        fetchMints();
        setRecord("");
        setDomain("");
      }
    } catch (error) {
      console.log("Weeh.. There was an error", error);
    }
    setLoading(false);
  };

  const renderMints = () => {
    if (currentAccount && mints.length > 0) {
      return (
        <div className="mint-container">
          <p className="subtitle"> Recently minted domains!</p>
          <div className="mint-list">
            {mints.map((mint, index) => {
              return (
                <div className="mint-item" key={index}>
                  <div className="mint-row">
                    <a
                      className="link"
                      href={`https://testnets.opensea.io/assets/Velas Tesnet/${CONTRACT_ADDRESS}/${mint.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <p className="underlined">
                        {" "}
                        {mint.name}
                        {tld}{" "}
                      </p>
                    </a>
                    {/* If mint.owner is currentAccount, add an "edit" button*/}
                    {mint.owner.toLowerCase() ===
                    currentAccount.toLowerCase() ? (
                      <button
                        className="edit-button"
                        onClick={() => editRecord(mint.name)}
                      >
                        <img
                          className="edit-icon"
                          src="https://img.icons8.com/metro/26/000000/pencil.png"
                          alt="Edit button"
                        />
                      </button>
                    ) : null}
                  </div>
                  <p> {mint.record} </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  // render method
  //creating a function to render if wallet is not connected yet
  const renderNotConnected = () => (
    <div className="connect-wallet-container">
      <img
        src="https://media.giphy.com/media/l0HlBX6r6GAeCbez6/giphy.gif"
        alt="kip gif"
      />
      {/* calling the connected button */}
      <button
        onClick={connectWallet}
        className="cta-button connect-wallet-button"
      >
        Connect Wallet
      </button>
    </div>
  );

  // form to enter domain name and data
  const inputForm = () => {
    // If not on velas testnet , pleas connect to the Velas testnet"
    if (network !== "Velas Testnet") {
      return (
        <div className="connect-wallet-container">
          <p>Please connect to the Velas Testnet</p>
          <button className="cta-button mint-button" onClick={switchNetwork}>
            Click here to switch
          </button>
        </div>
      );
    }
    return (
      <div className="form-container">
        <div className="first-row">
          <input
            type="text"
            value={domain}
            placeholder="domain name"
            onChange={(e) => setDomain(e.target.value)}
          />
          <p className="tld"> {tld} </p>
        </div>

        <input
          type="text"
          value={record}
          placeholder="whats your super domain power"
          onChange={(e) => setRecord(e.target.value)}
        />

        {/* If the editing variable is true, return the "Set record" and "Cancel" button */}
        {editing ? (
          <div className="button-container">
            {/* This will call the updateDomain function*/}
            <button
              className="cta-button mint-button"
              disabled={loading}
              onClick={updateDomain}
            >
              Set record
            </button>
            {/* This will let us get out of editing mode by setting editing to false */}
            <button
              className="cta-button mint-button"
              onClick={() => {
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          // If editing is not true, the mint button will be returned instead
          <button
            className="cta-button mint-button"
            disabled={loading}
            onClick={mintDomain}
          >
            Mint
          </button>
        )}
        {renderMints()}

        {/* {mints.map((domain, i) => (
          <div key={i}>
            <div className="mint-list">{domain.name + ".VLX"}</div>
          </div>
        ))} */}
      </div>
    );
  };

  // returning a function when the page loades
  // useEffect(() => {
  //   checkIfWalletIsConnected();
  // }, []);

  // This will take us into edit mode and show us the edit buttons!
  const editRecord = (name) => {
    console.log("Editing record for", name);
    setEditing(true);
    setDomain(name);
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    mintDomain();
  }, []);

  // This will run any time currentAccount or network are changed
  useEffect(() => {
    if (network === "Velas Testnet") {
      fetchMints();
    }
  }, [currentAccount, network]);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <header>
            <div className="left">
              <p className="title">Welcome to Velas Name Service:</p>
            </div>
            <div className="right">
              <img
                alt="Network logo"
                className="logo"
                src={network.includes("Velas") ? velasLogo : ethLogo}
              />
              {currentAccount ? (
                <p>
                  {" "}
                  Wallet: {currentAccount.slice(0, 6)}...
                  {currentAccount.slice(-4)}{" "}
                </p>
              ) : (
                <p> Not connected </p>
              )}
            </div>
          </header>
        </div>

        {/* Hide the connect button if currentAccount isn't empty */}
        {!currentAccount && renderNotConnected()}
        {/* Render the input form if an account is connected */}
        {currentAccount && inputForm()}
        {/* {mints && renderMints} */}

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
