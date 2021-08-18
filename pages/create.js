import { useEffect, useState } from "react";
import Web3 from "web3";
import EventCreator from "../abis/EventCreator.json";
import { useRouter } from "next/router";
const IPFS = require("ipfs-core");

export default function Create() {
  const router = useRouter();

  const [primaryAccount, setPrimaryAccount] = useState(null);
  const [eventCreator, setEventCreator] = useState(null);
  const [imgBuffer, setImgBuffer] = useState(null);

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

      // Fetch Network ID
      const networkId = await web3.eth.net.getId();
      const networkData = EventCreator.networks[networkId];

      if (networkData) {
        // Deploy EventCreator contract
        const ec = await new web3.eth.Contract(EventCreator.abi, networkData.address);
        await setEventCreator(ec);
      }
    }

    loadWeb3();
    loadBlockchainData();
  }, []);

  const uploadImage = async () => {
    // Upload buffer to IPFS
    const node = await IPFS.create();
    const { cid } = await node.add(imgBuffer);
    return cid.toString();
  };

  const convertToByte = (event) => {
    // Convert image to byte data
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);

    reader.onloadend = () => {
      setImgBuffer(Buffer(reader.result));
    };
  };

  const createEvent = async (event) => {
    event.preventDefault();

    // Get IPFS hash
    const hash = await uploadImage();

    // form obj
    let formDetails = {
      ipfsHash: hash,
      title: event.target.title.value,
      description: event.target.description.value,
      location: event.target.location.value,
      price: event.target.price.value,
      startOffset: event.target.startdate.value, // need to do calculation here
      endOffset: event.target.enddate.value, // calculation here
    };

    // Create Event
    await eventCreator.methods
      .createEvent(
        formDetails.ipfsHash,
        formDetails.title,
        formDetails.description,
        formDetails.location,
        formDetails.price,
        formDetails.startOffset,
        formDetails.endOffset
      )
      .send({ from: primaryAccount.toString() });

    // Redirect to Home
    router.push({ pathname: "/" });
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-center px-80 my-12">
        <form className="w-full" onSubmit={createEvent}>
          <div className="shadow overflow-hidden rounded-md">
            <div className="px-4 py-5 bg-white p-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="col-span-3 sm:col-span-2">
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                    Cover Image
                  </label>
                  <input id="image" image="image" type="file" required accept="image/*" onChange={convertToByte} />
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    id="title"
                    title="title"
                    type="text"
                    required
                    className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    description="description"
                    type="text"
                    required
                    className="resize-y border rounded-md mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  ></textarea>
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    id="location"
                    location="location"
                    type="text"
                    required
                    className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price (in Wei)
                  </label>
                  <input
                    id="price"
                    price="price"
                    type="text"
                    required
                    className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <label htmlFor="startdate" className="block text-sm font-medium text-gray-700">
                    Start Date Offset (in Seconds)
                  </label>
                  <input
                    id="startdate"
                    startdate="startdate"
                    type="text"
                    required
                    className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <label htmlFor="enddate" className="block text-sm font-medium text-gray-700">
                    End Date Offset (in Seconds)
                  </label>
                  <input
                    id="enddate"
                    enddate="enddate"
                    type="text"
                    required
                    className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
