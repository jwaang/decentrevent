import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Web3 from "web3";
import Event from "../../abis/Event.json";
import { convertEpochToDate } from "../../helper/functions";
import Image from "next/image";
import Banner from "../../components/shared/Banner";
import { useAppContext } from "../../layouts/BaseLayout";

const EventPage = () => {
  const roleEnum = {
    COORDINATOR: "COORDINATOR",
    PARTICIPANT: "PARTICIPANT",
    NONE: "NONE",
  };

  const eventStateEnum = {
    VALID: "VALID",
    CANCELED: "CANCELED",
    INVALID: "INVALID",
    RUNNING: "RUNNING",
    FINISHED: "FINISHED",
    NOT_STARTED: "NOT_STARTED",
  };

  const addr = useAppContext();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [event, setEvent] = useState(null);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [role, setRole] = useState(roleEnum.NONE);
  const [currentState, setCurrentState] = useState(eventStateEnum.RUNNING);

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
        coordinator: d[7],
        votingPeriodOffset: d[8],
      });
    }

    loadWeb3();
    loadBlockchainData();
    getEventState();
  }, [router.isReady]);

  useEffect(() => {
    if (addr.primaryAccount) getRoles();
  }, [addr.primaryAccount]);

  useEffect(() => {
    console.log(currentState);
  }, [currentState]);

  const getRoles = async () => {
    console.log("Address changed", addr.primaryAccount);
    const web3 = window.web3;
    web3.eth.defaultAccount = addr.primaryAccount;
    const eventDetails = await new web3.eth.Contract(Event.abi, address);
    const result = await eventDetails.methods.getRole().call();

    // set role
    if (result[1]) setRole(roleEnum.COORDINATOR);
    else if (result[2]) setRole(roleEnum.PARTICIPANT);
    else setRole(roleEnum.NONE);
  };

  const getEventState = async () => {
    const web3 = window.web3;
    const eventDetails = await new web3.eth.Contract(Event.abi, address);
    const result = await eventDetails.methods.getEventState().call();

    console.log(result);
    if (result[0]) setCurrentState(eventStateEnum.VALID);
    else if (result[1]) setCurrentState(eventStateEnum.CANCELED);
    else if (result[2]) setCurrentState(eventStateEnum.INVALID);
    else if (!result[0] && !result[1] && !result[2]) setCurrentState(eventStateEnum.FINISHED);
    // else if (result[3]) setCurrentState(eventStateEnum.INVALID);
    // else if (result[4]) setCurrentState(eventStateEnum.NOT_STARTED);
    // else if (!result[0] && !result[1] && !result[2]) setCurrentState(eventStateEnum.FINISHED);
  };

  const purchaseTicket = async () => {
    console.log("Purchasing Ticket");
    const web3 = window.web3;
    const eventDetails = await new web3.eth.Contract(Event.abi, address);
    console.log("con address", address);
    console.log("user addr", addr);
    eventDetails.methods
      .purchaseTicket()
      .send({ from: addr.primaryAccount, to: address, value: event.price })
      .then((res) => {
        console.log("Success", res);
        getRoles(); // refresh roles after purchasing ticket
      })
      .catch((err) => {
        const str = err.message;
        let parsedMsg = JSON.parse(str.split("'")[1]);
        let message = parsedMsg.value.data.message;
        let errMsg = message.split("revert")[1];
        setErrorMessage(errMsg);
        setIsBannerVisible(true);
      });
  };

  const getPayment = async () => {
    console.log("Coordinator gets payment");
    const web3 = window.web3;
    const eventDetails = await new web3.eth.Contract(Event.abi, address);
    await eventDetails.methods
      .getPayment()
      .send({ from: addr.primaryAccount })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        const str = err.message;
        let parsedMsg = JSON.parse(str.split("'")[1]);
        let message = parsedMsg.value.data.message;
        let errMsg = message.split("revert")[1];
        setErrorMessage(errMsg);
        setIsBannerVisible(true);
      });
  };

  const getRefund = async () => {
    console.log("Requesting refund");
    const web3 = window.web3;
    const eventDetails = await new web3.eth.Contract(Event.abi, address);
    await eventDetails.methods
      .getRefund()
      .send({ from: addr.primaryAccount })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        const str = err.message;
        let parsedMsg = JSON.parse(str.split("'")[1]);
        let message = parsedMsg.value.data.message;
        let errMsg = message.split("revert")[1];
        setErrorMessage(errMsg);
        setIsBannerVisible(true);
      });
  };

  const cancelEvent = async () => {
    console.log("Canceling event");
    const web3 = window.web3;
    const eventDetails = await new web3.eth.Contract(Event.abi, address);
    await eventDetails.methods
      .cancelEvent()
      .send({ from: addr.primaryAccount })
      .then(() => {
        // logic to show event has been canceled
        // should get event state
        getEventState();
      })
      .catch((err) => {
        const str = err.message;
        let parsedMsg = JSON.parse(str.split("'")[1]);
        let message = parsedMsg.value.data.message;
        let errMsg = message.split("revert")[1];
        setErrorMessage(errMsg);
        setIsBannerVisible(true);
      });
  };

  const vote = async (isValid) => {
    console.log("Vote", isValid);
    const web3 = window.web3;
    const eventDetails = await new web3.eth.Contract(Event.abi, address);
    await eventDetails.methods
      .vote(isValid)
      .send({ from: addr.primaryAccount })
      .then((res) => {
        console.log(res);
        getEventState();
      })
      .catch((err) => {
        const str = err.message;
        let parsedMsg = JSON.parse(str.split("'")[1]);
        let message = parsedMsg.value.data.message;
        let errMsg = message.split("revert")[1];
        setErrorMessage(errMsg);
        setIsBannerVisible(true);
      });
  };

  return (
    <div>
      {event && (
        <>
          <section className="container mx-auto px-5">
            <div className="flex flex-col items-center pt-4">
              {isBannerVisible ? <Banner errorMessage={errorMessage} setIsBannerVisible={setIsBannerVisible} /> : null}
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
                      {currentState === eventStateEnum.CANCELED && (
                        <p className="text-sm font-bold text-green-700 mb-3">
                          This event has been canceled. If you&apos;re a participant, you can claim your refund below.
                        </p>
                      )}
                      {currentState === eventStateEnum.INVALID && (
                        <p className="text-sm font-bold text-green-700 mb-3">
                          Partcipants have voted this as an invalid event. If you&apos;re a participant, you can claim your refund below.
                        </p>
                      )}
                      {currentState === eventStateEnum.VALID && (
                        <p className="text-sm font-bold text-green-700 mb-3">
                          Both the event and voting period is over. If you&apos;re the coordinator, you can collect your payment below.
                        </p>
                      )}
                      <p className="text-sm font-medium text-gray-400">Host</p>
                      <p className="mb-2 text-xs break-all">{event.coordinator}</p>
                      <p className="text-sm font-medium text-gray-400">Location</p>
                      <p className="mb-2 text-xs">{event.location}</p>
                      <p className="text-sm font-medium text-gray-400">Price</p>
                      <p className="mb-2 text-xs">{event.price} wei</p>
                      <p className="text-sm font-medium text-gray-400">Date and Time</p>
                      <p className="mb-4 text-xs">
                        {convertEpochToDate(event.startDate)} – {convertEpochToDate(event.endDate)}
                      </p>
                      <p className="text-sm font-medium text-gray-400">Voting Ends</p>
                      <p className="mb-4 text-xs">{convertEpochToDate(event.votingPeriodOffset)}</p>

                      {role === roleEnum.NONE && currentState !== eventStateEnum.CANCELED && (
                        <button
                          onClick={() => purchaseTicket()}
                          className="w-full mb-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Purchase Ticket
                        </button>
                      )}
                      {role === roleEnum.PARTICIPANT && currentState !== eventStateEnum.CANCELED && (
                        <button
                          onClick={() => vote(true)}
                          className="w-full mb-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Vote Valid
                        </button>
                      )}
                      {role === roleEnum.PARTICIPANT && currentState !== eventStateEnum.CANCELED && (
                        <button
                          onClick={() => vote(false)}
                          className="w-full mb-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Vote Not Valid
                        </button>
                      )}
                      {role === roleEnum.COORDINATOR && (currentState === eventStateEnum.VALID || currentState === eventStateEnum.FINISHED) && (
                        <button
                          onClick={() => getPayment()}
                          className="w-full mb-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Get Payment
                        </button>
                      )}
                      {role === roleEnum.PARTICIPANT && (currentState === eventStateEnum.CANCELED || currentState === eventStateEnum.INVALID) && (
                        <button
                          onClick={() => getRefund()}
                          className="w-full mb-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Get Refund
                        </button>
                      )}
                      {role === roleEnum.COORDINATOR && currentState !== eventStateEnum.CANCELED && (
                        <button
                          onClick={() => cancelEvent()}
                          className="w-full mb-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Cancel Event
                        </button>
                      )}
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
