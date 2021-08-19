import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Web3 from "web3";
import Event from "../../abis/Event.json";
import { convertEpochToDate } from "../../helper/functions";

const EventPage = () => {
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const { address } = router.query;

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
  }, []);

  return (
    <div>
      <span>Hello {address}</span>
      {event && (
        <>
          <p className="my-2 text-xs">{event.description}</p>
          <p className="my-2 text-xs">📍 {event.location}</p>
          <p className="my-2 text-xs">{event.price} wei</p>
          <p className="my-2 text-xs">📅 Start Date - {convertEpochToDate(event.startDate)}</p>
          <p className="my-2 text-xs">📅 End Date - {convertEpochToDate(event.endDate)}</p>
        </>
      )}
    </div>
  );
};

export default EventPage;
