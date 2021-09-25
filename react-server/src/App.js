import StickyHeader from './StickyHeader';
import CreatorContent from './CreatorContent';
import SubscriptionContent from './SubscriptionContent';
import './App.css';
import { useState, useEffect } from 'react';
import { useMoralis } from 'react-moralis';
import detectEthereumProvider from '@metamask/detect-provider';
import SuperFluidSDK from '@superfluid-finance/js-sdk';
import Web3 from 'web3';
import { userExistingPageKey, userPageInfoKey, calculateFlowRate } from './config';
import BigNumber from 'bignumber.js';
import { ERC20abi } from './abis/ERC20abi';
import { fDAIxabi } from './abis/fDAIxabi';
import { tokens } from './config';

function App () {
  const { user, setUserData, web3 } = useMoralis();
  const [ contentUnlocked, setContentUnlocked ] = useState(true);
  const [ sf, setSf ] = useState({});
  const [ connected, setConnected ] = useState(true);
  const [ account, setAccount ] = useState(""); 
  const [ fDAI, setfDAI ] = useState({});
  const [ fDAIx, setfDAIx ] = useState({});
  const [ balance, setBalance ] = useState(0);
  const [ address, setAddress ] = useState("");
  var atValidWalletAddress = false;

  useEffect(() => {
    const path = window.location.pathname.slice(1);
    if (web3.utils.isAddress(path)) {
      setAddress(path);
      atValidWalletAddress = true;
    }
    else if (window.location.pathname !== "/") {
      window.location.pathname = "/"; // invalid paths are redirected to "/"
    }
    (async () => {
      await initWeb3();
    })();
  }, []);

  useEffect(() => { 
    if (user !== null) {
      const pageExists = user.get(userExistingPageKey);
      if (pageExists === undefined) {
        setUserData({[userExistingPageKey] : false});
      }
    }
  }, [user]);

  useEffect(() => {
    if (account != undefined && account != "" && web3.utils.isAddress(account)) {
      (async () => {
        await getBalance();
      })();
    }
  }, [account])

  const initWeb3 = async () => {
    const provider = await detectEthereumProvider();
    const web3 = new Web3(provider);

    if (provider) {
      const sf = new SuperFluidSDK.Framework({
        web3: web3
      });

      await sf.initialize();

      const fDAI = new web3.eth.Contract(ERC20abi, tokens.ropsten.fDAI);
      const fDAIx = new web3.eth.Contract(fDAIxabi, tokens.ropsten.fDAIx);

      setfDAI(fDAI);
      setfDAIx(fDAIx);
      setSf(sf);

      await getAccount();

      await getBalance();

      console.log("Successfully initialized");
    }
    else {
      console.log("NO METAMASK DETECTED");
    }
  }

  const getAccount = async () => {
    const acct = await window.ethereum.request({method: 'eth_accounts'});
    if (acct.length > 0) {
      setConnected(true);
      setAccount(acct[0]);
      if (atValidWalletAddress === false) {
        setAddress(acct[0]);
      }
    }
    else if (acct.length === 0) {
      setConnected(false);
      setAccount("");
      if (atValidWalletAddress === false) {
        setAddress("");
      }
    }

    let currentAccount = acct[0];
    window.ethereum.
    request({ method: 'eth_accounts' })
    .then(handleAccountsChanged)
    .catch(err => {
      console.error(err);
    });

    function handleAccountsChanged(accounts) {
      if (accounts.length === 0) {
        console.log("Please connect to MetaMask.");
      }
      else if (accounts[0] !== currentAccount) {
        currentAccount = accounts[0];
      }
    }
    window.ethereum.on('accountsChanged', isConnected, handleAccountsChanged);
  }

  const isConnected = () => {
    let accts = window.ethereum._state.accounts;

    if (accts.length === 0) {
      console.log("NOT CONNECTED");
      setConnected(false);
    }
    else {
      console.log("CONNECTED");
      setAccount(accts[0]);
      setConnected(true);
    }
  }

  const createStream = async (address, amount) => {
    let newFlowRate = calculateFlowRate(amount);

    const tx = (sf.cfa._cfa.contract.methods
    .updateFlow(
        tokens.ropsten.fDAI.toString(),
        address.toString(),
        newFlowRate.toString(),
        "0x"
    )
    .encodeABI());

    await sf.host.contract.methods.callAgreement(
        sf.cfa._cfa.address, tx, "0x")
        .send({from: this.state.account, type: "0x2"})
    .then(console.log)
    .then(await this.listOutFlows())   
  }

  const getBalance = async () => {
    if (account.length > 0) {
      const balance = await fDAIx.methods.balanceOf(account).call({from: account});
      const adjustedBalance = Number(new BigNumber(balance).shiftedBy(-18)).toFixed(5);
      setBalance(adjustedBalance);
    }
  }

  return (
    <div className="App">
      <StickyHeader balance={Math.floor(balance)} getAccount={getAccount} connected={connected} account={account} />
      <CreatorContent createStream={createStream} balance={balance} address={address} />
      <SubscriptionContent unlocked={contentUnlocked} />
    </div>
  );
}

export default App;
