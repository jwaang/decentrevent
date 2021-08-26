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
        {events.map((event, index) => {
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
        })}
      </div>
    </div>
  );
}
