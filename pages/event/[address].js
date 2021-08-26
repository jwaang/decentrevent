import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Web3 from "web3";
import Event from "../../abis/Event.json";
import { convertEpochToDate } from "../../helper/functions";
import Image from "next/image";
import { useAppContext } from "../../layouts/BaseLayout";

const EventPage = () => {
  const addr = useAppContext();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const { address } = router.query;

  useEffect(() => {
    // call below functions only if router has finished rendering and fetched address value
    if (!router.isReady) return;

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
      const web3 = window.web3;
      const eventDetails = await new web3.eth.Contract(Event.abi, address);
      const d = await eventDetails.methods.returnEventDetails().call();
      setEvent({
        image: d[0],
        title: d[1],
        description: d[2],
        location: d[3],
        price: d[4],
        startDate: d[5],
        endDate: d[6],
      });
    }

    loadWeb3();
    loadBlockchainData();
  }, [router.isReady]);

  const purchaseTicket = async () => {
    console.log("Purchasing Ticket");
    const web3 = window.web3;
    const eventDetails = await new web3.eth.Contract(Event.abi, address);
    console.log("con address", address);
    console.log("user addr", addr);
    eventDetails.methods.purchaseTicket().send({ from: addr.primaryAccount, to: address, value: 1000 });
  };

  return (
    <div>
      {event && (
        <>
          <section className="container mx-auto px-5">
            <div className="flex flex-col items-center py-8">
              <div className="flex flex-col w-full mb-12 text-left">
                <div className="shadow overflow-hidden rounded-md px-4 py-5 bg-white p-6 w-full mx-auto lg:w-1/2">
                  <div className="relative w-full">
                    <Image
                      className="rounded-xl"
                      src={`https://ipfs.io/ipfs/${event.image}`}
                      layout="responsive"
                      objectFit="cover"
                      width={8}
                      height={4}
                      alt=""
                    />
                  </div>
                  <h2 className="mx-auto mt-4 mb-4 text-xl font-semibold text-black">{event.title}</h2>
                  <div className="flex justify-between">
                    <div className="flex-1 mr-6">
                      <p className="text-sm font-medium text-gray-400">About this event</p>
                      <p className="my-2 text-xs">{event.description}</p>
                    </div>
                    <div className="w-4/12">
                      <p className="text-sm font-medium text-gray-400">Host</p>
                      <p className="mb-2 text-xs break-all">{address}</p>
                      <p className="text-sm font-medium text-gray-400">Location</p>
                      <p className="mb-2 text-xs">{event.location}</p>
                      <p className="text-sm font-medium text-gray-400">Price</p>
                      <p className="mb-2 text-xs">{event.price} wei</p>
                      <p className="text-sm font-medium text-gray-400">Date and Time</p>
                      <p className="mb-4 text-xs">
                        {convertEpochToDate(event.startDate)} – {convertEpochToDate(event.endDate)}
                      </p>

                      <button
                        onClick={() => purchaseTicket()}
                        className="w-full mb-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Purchase Ticket
                      </button>
                      <button className="w-full mb-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        Vote
                      </button>
                      <button className="w-full mb-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        Get Payment
                      </button>
                      <button className="w-full mb-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        Get Refund
                      </button>
                      <button className="w-full mb-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        Cancel Event
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default EventPage;
