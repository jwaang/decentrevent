const { assert } = require("chai");

const EventCreator = artifacts.require("./EventCreator.sol");

require("chai").use(require("chai-as-promised")).should();

contract("EventCreator", () => {
  let eventCreator;

  before(async () => {
    eventCreator = await EventCreator.deployed();
  });

  describe("deployment", async () => {
    it("deploys successfully", async () => {
      const address = await eventCreator.address;
      console.log(address);
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });
  });

  describe("create event", async () => {
    it("creates event successfully", async () => {
      const event = await eventCreator.createEvent(
        "IPFS HASH",
        "EVENT TITLE YEET",
        "EVENT DESCRIPTION BLAH BLAH",
        "TEXAS",
        "1000000000000000000",
        15,
        30
      );
      console.log(event);
    });
  });
});

contract("Event", () => {
  let event;

  before(async () => {
    eventCreator = await EventCreator.deployed();
  });

  describe("deployment", async () => {
    it("deploys successfully", async () => {
      const address = await eventCreator.address;
      console.log(address);
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });
  });
});
