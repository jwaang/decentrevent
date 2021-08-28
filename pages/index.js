import Image from "next/image";
import { useEffect, useState } from "react";
import Web3 from "web3";
import Event from "../abis/Event.json";
import EventCreator from "../abis/EventCreator.json";
import Link from "next/link";
import { convertEpochToDate } from "../helper/functions";

export default function Home() {
  const [events, setEvents] = useState([]);

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
      // Fetch Network ID
      const web3 = window.web3;
      const networkId = await web3.eth.net.getId();
      const networkData = EventCreator.networks[networkId];

      if (networkData) {
        // Deploy EventCreator contract
        const ec = await new web3.eth.Contract(EventCreator.abi, networkData.address);

        // Get current total number of events
        const eventCount = await ec.methods.eventCount().call();

        // Save all event addresses
        let tmp = [];
        for (var i = 0; i < eventCount; i++) {
          // iterate through events array and fetch addresses
          const eventAddress = await ec.methods.events(i).call();
          // get event contract data
          const eventDetails = await new web3.eth.Contract(Event.abi, eventAddress);
          const d = await eventDetails.methods.returnEventDetails().call();
          let details = {
            image: d[0],
            title: d[1],
            description: d[2],
            location: d[3],
            price: d[4],
            startDate: d[5],
            endDate: d[6],
            address: eventAddress,
          };
          tmp.unshift(details); // push to front, we want newest events first
        }
        setEvents(tmp);
        console.log(events);
      }
    }

    loadWeb3();
    loadBlockchainData();
  }, []);

  return (
    <div>
      <div className="mt-5 md:mt-0 md:col-span-2">
        {events.length > 0 ? (
          events.map((event, index) => {
            return (
              <div key={index} className="py-4 flex items-center">
                <Link href={`/event/${event.address}`} passHref>
                  <div className="container mx-auto p-9 bg-white max-w-sm rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition duration-300 cursor-pointer">
                    <div className="relative w-auto h-40 mb-4">
                      <Image className="rounded-xl" src={`https://ipfs.io/ipfs/${event.image}`} layout="fill" objectFit="contain" alt="" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="w-full">
                        <h1 className="mx-auto mt-4 mb-4 text-xl font-semibold text-black">{event.title}</h1>
                        <p className="my-2 text-xs">📅 {convertEpochToDate(event.startDate)}</p>
                        <p className="my-2 text-xs">📍 {event.location}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })
        ) : (
          <div className="flex py-24 justify-center">
            <div className="p-12 text-center max-w-2xl">
              <div className="shadow overflow-hidden rounded-md">
                <div className="px-4 py-5 bg-white p-6">
                  <div className="md:text-3xl text-3xl font-bold">No events here... yet! 😯</div>
                  <div className="text-xl font-normal mt-4">You can create one by clicking the button below</div>
                  <div className="mt-6 flex justify-center h-12 relative">
                    <div className="flex shadow-md font-medium absolute py-2 px-4 text-green-100 cursor-pointer rounded text-lg tr-mt border border-transparent rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                      <Link href="/create">Create Event</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
