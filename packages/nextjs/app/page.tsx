"use client";

import { useState } from "react";
import EASContract from "../contracts/EAS.json";
import { getEthersSigner } from "./utils/eas-wagmi-utils";
import schemas from "./utils/schemas.json";
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { Datepicker } from "flowbite-react";
import type { NextPage } from "next";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import QrReader from "~~/components/QrReader";
import { Address } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [receiverAddress, setReceiverAddress] = useState("0x0000000000000000000000000000000000000000");
  const [openQr, setOpenQr] = useState<boolean>(false);
  const schemaUID = "0xd465df4ee00a2176cff40e5e23226afc3acdd7871f3fa7a4b1c2c28ade7a30cf";
  const [event, setEvent] = useState(schemas.events[0]);

  const handleEventChange = (e: any) => {
    setEvent(schemas.events[e.target.value]);
  };

  // Callback function to handle the value from child
  const handleQRValue = (value: string) => {
    if (isAddress(value)) {
      setReceiverAddress(value);
      notification.success(
        <>
          <p className="font-bold m-0">Address Scanned!</p>
          <p className="m-0">
            The address has been verified
            <br /> you can make the attestation.
          </p>
        </>,
      );
    } else {
      const addr = (value as string).substring((value as string).indexOf(":") + 1, (value as string).lastIndexOf("@"));
      if (isAddress(addr)) {
        setReceiverAddress(addr);
      }
    }
    setOpenQr(false);
  };

  const onAttest = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const eas = new EAS(EASContract.address);
    const signer = await getEthersSigner({ chainId: 534352 });
    if (signer) {
      eas.connect(signer);
      // Initialize SchemaEncoder with the schema string
      const schemaEncoder = new SchemaEncoder(
        "uint256 id, string name, string location, string startDate, string endDate",
      );
      const encodedData = schemaEncoder.encodeData([
        { name: "id", value: event.id, type: "uint256" },
        { name: "name", value: event.name, type: "string" },
        { name: "location", value: event.location, type: "string" },
        { name: "startDate", value: event.startDate, type: "string" },
        { name: "endDate", value: event.endDate, type: "string" },
      ]);
      const tx = await eas.attest({
        schema: schemaUID,
        data: {
          recipient: receiverAddress,
          expirationTime: BigInt(0),
          revocable: true, // Be aware that if your schema is not revocable, this MUST be false
          data: encodedData,
        },
      });

      const newAttestationUID = await tx.wait();

      console.log("New attestation UID:", newAttestationUID);
    } else {
      //alert error
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">Ethereum TGU Attester</span>
          </h1>
          <div className="flex justify-center items-center space-x-2">
            <p className="my-2 font-medium">Attester:</p>
            <Address address={connectedAddress} />
          </div>
          <div className="flex justify-center items-center space-x-2">
            <p className="my-2 font-medium">Receiver:</p>
            {receiverAddress == "0x0000000000000000000000000000000000000000" ? (
              <p> Not selected </p>
            ) : (
              <Address address={receiverAddress} />
            )}

            <button
              type="submit"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              onClick={() => setOpenQr(!openQr)}
            >
              Scan QR
            </button>
          </div>

          {receiverAddress != "0x0000000000000000000000000000000000000000" && (
            <>
              <form className="max-w-sm mx-auto">
                <label
                  htmlFor="events"
                  className="block mb-2 text-lg font-medium text-center text-gray-900 dark:text-white"
                >
                  Select Event
                </label>
                <select
                  id="events"
                  value={event.id}
                  onChange={handleEventChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  {schemas.events.map((event, i) => (
                    <option key={event.id} value={i}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </form>
              <form className="mt-4">
                <div className="grid gap-6 mb-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="first_name"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Event Name
                    </label>
                    <input
                      type="text"
                      id="event_name"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Ethereum TGU Meetup"
                      value={event.name}
                      disabled
                    />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Event Location
                    </label>
                    <input
                      type="text"
                      id="event_location"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Casa Sol"
                      value={event.location}
                      disabled
                    />
                  </div>
                  <div>
                    <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Start Date
                    </label>
                    <Datepicker id="date" value={event.startDate} disabled />
                  </div>
                  <div>
                    <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      End Date
                    </label>
                    <Datepicker id="date" value={event.endDate} disabled />
                  </div>
                  {/* <div>
                    <label htmlFor="id" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Event ID
                    </label>
                    <input
                      type="tel"
                      id="id"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="1"
                      value={event.id}
                      disabled
                    />
                  </div> */}
                </div>
              </form>

              <button
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onClick={onAttest}
              >
                Attest
              </button>
            </>
          )}
        </div>
      </div>
      {openQr && <QrReader onHandleQRValue={handleQRValue} />}
    </>
  );
};

export default Home;
