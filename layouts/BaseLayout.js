import Navbar from "../components/shared/Navbar";
import { useEffect, createContext, useContext, useState } from "react";
import Web3 from "web3";

const AppContext = createContext();

export function BaseLayout({ children }) {
  const [primaryAccount, setPrimaryAccount] = useState(null);
  let sharedState = { primaryAccount };

  useEffect(() => {
    async function loadWeb3() {
      if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
      } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
      } else {
        window.alert("Non-Ethereum browser detected. You should consider trying MetaMask!");
      }
    }
    async function loadBlockchainData() {
      // Load account using MetaMask
      const web3 = window.web3;
      const accounts = await web3.eth.getAccounts();
      await setPrimaryAccount(accounts[0]);
    }

    loadWeb3();
    loadBlockchainData();
  }, []);

  return (
    <AppContext.Provider value={sharedState}>
      <div className="fixed w-full h-full bg-gradient-to-t from-green-200 to-green-500" style={{ zIndex: -1 }}></div>
      <Navbar className="z-10"></Navbar>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const state = useContext(AppContext);

  if (state === undefined) {
    throw new Error("useUserState must be used within a UserProvider");
  }

  return state;
}
