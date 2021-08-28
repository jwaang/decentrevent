//SPDX-License-Identifier: GPL-3.0
 
pragma solidity >=0.5.0 <0.9.0;

contract EventCreator{
    Event[] public events;
    string public name = "Event Creator";
    uint public eventCount = 0;

    function createEvent(string memory _image, string memory _title, string memory _description, string memory _location, uint _ticketPrice, uint _startDateOffset, uint _endDateOffset, uint _votingPeriodOffset) public {
        Event newEvent = new Event(msg.sender, _image, _title, _description, _location, _ticketPrice, _startDateOffset, _endDateOffset, _votingPeriodOffset);
        events.push(newEvent);
        ++eventCount;
    }
}

contract Event{
    
    /* State Variables */
    address payable public coordinator;
    
    mapping(address => uint) public participants;
    address[] public participantsAddr;
    uint public numParticipants;
    
    string public image;
    string public title;
    string public description;
    string public location;
    uint public ticketPrice;
    uint public startDate;
    uint public endDate;

    mapping(address => bool) public participantVote;
    uint public numOfValidVotes;
    uint public numOfInvalidVotes;
    uint public votingPeriodOffset;
    
    bool public isValid;
    bool public isInvalidAndVoted;
    bool public isCanceled;
    
    /* Constructor */
    constructor(address eoa, string memory _image, string memory _title, string memory _description, string memory _location, uint _ticketPrice, uint _startDateOffset, uint _endDateOffset, uint _votingPeriodOffset){
        require(_endDateOffset > _startDateOffset, "End date should be after start date!"); 
        coordinator = payable(eoa);
        image = _image;
        title = _title;
        description = _description;
        location = _location;
        ticketPrice = _ticketPrice;
        startDate = block.timestamp + _startDateOffset;
        endDate = block.timestamp + _endDateOffset;
        votingPeriodOffset = _votingPeriodOffset;
    }
    
    /* Events */
    event PurchaseTicketEvent(address _sender, uint _value);
    event GetRefundEvent(address _sender, uint _value);
    event VoteEvent(address _sender, bool _isValidEvent, uint _numOfValidVotes, uint _numOfInvalidVotes, uint _numParticipants);
    event GetPaymentEvent(address _sender, uint _value);
    event CancelEvent(bool _isCanceled);


    /* Functions */
    // Participants ticket purchase
    receive() payable external{
        purchaseTicket();
    }

    function purchaseTicket() public payable notCoordinator notRunning notCanceled {
        require(msg.value == ticketPrice, "You must pay the exact amount!");
        require(participants[msg.sender] == 0, "You have already purchased a ticket!");
        
        if(participants[msg.sender] == 0){
            numParticipants++;
        }
        
        participants[msg.sender] += msg.value;
        participantVote[msg.sender] = false;
        participantsAddr.push(msg.sender);

        emit PurchaseTicketEvent(msg.sender, msg.value);
    }
    
    // Participants refund option
    function getRefund() public notCoordinator {
        require(isInvalidAndVoted == true || isCanceled == true, "This event either has to be canceled or invalid to get a refund!");

        address payable recipient = payable(msg.sender);
        uint value = participants[msg.sender];
        recipient.transfer(value);
        participants[msg.sender] = 0;

        emit GetRefundEvent(msg.sender, value);
    }

    // Particpants vote on event after end date
    function vote(bool isValidEvent) public notCoordinator notCanceled {
        require(block.timestamp >= endDate, "This event has not ended yet!");
        require(block.timestamp <= endDate + votingPeriodOffset, "The voting period has already ended!");
        require(participants[msg.sender] > 0, "This user does not exist!");
        require(participantVote[msg.sender] == false, "This user has already voted!");

        // Update vote counter
        if(isValidEvent){
          numOfValidVotes++;
        } else {
          numOfInvalidVotes++;
        }
        participantVote[msg.sender] = true;

        // Update event state when all votes are counted
        uint halfOfParticipants = numParticipants / 2;
         if (numOfValidVotes > halfOfParticipants){
            isValid = true;
         } else if(numOfInvalidVotes > halfOfParticipants){
            isInvalidAndVoted = true;
         }

         emit VoteEvent(msg.sender, isValidEvent, numOfValidVotes, numOfInvalidVotes, numParticipants);
    }
    
    // Coordinator transfer payment option
    function getPayment() public isCoordinator notCanceled {
        // skip enough voters have voted valid
        if (isValid == false){
            require(block.timestamp >= endDate, "This event has not ended yet!");
            require(block.timestamp >= endDate + votingPeriodOffset, "The voting period has not ended yet!");
        }
        
        uint halfOfParticipants = numParticipants / 2;

        // more than 50% of voters vote valid OR not enough votes for either option
        if(numOfValidVotes > halfOfParticipants || (numOfValidVotes < halfOfParticipants && numOfInvalidVotes < halfOfParticipants)){
          address payable recipient = payable(msg.sender);
          for(uint i = 0; i < numParticipants; ++i){
              // reset partcipant balance to 0
              participants[participantsAddr[i]] = 0;
          }
          uint total = getBalance();
          recipient.transfer(total);
          emit GetPaymentEvent(msg.sender, total);
        } 
        // more than 50% of voters vote invalid
        else if(numOfInvalidVotes > halfOfParticipants){
          // unable to withdraw, show message or something 
          revert("Unable to withdraw. Participants have voted the event invalid.");
        }
    }
    
    // Coordinator event cancellation
    function cancelEvent() public isCoordinator notRunning notCanceled {
        isCanceled = true;
        emit CancelEvent(isCanceled);
    }
    
    // helper - get contract's current balance
    function getBalance() public view returns(uint){
        return address(this).balance;
    }

    // helper - get event details 
    function returnEventDetails() public view returns(string memory _image, string memory _title, string memory _description, string memory _location, uint _ticketPrice, uint _startDateOffset, uint _endDateOffset, address _coordinator, uint _votingPeriodOffset){
        return (image, title, description, location, ticketPrice, startDate, endDate, coordinator, endDate + votingPeriodOffset);
    }

    function getRole() public view returns(address _user, bool _isCoordinator, bool _isParticipant){
        bool isCoordinator = false;
        bool isParticipant = false;
        if (msg.sender == coordinator) isCoordinator = true;
        if (participants[msg.sender] > 0) isParticipant = true;
        return (address(msg.sender), isCoordinator, isParticipant);
    }

    function getEventState() public view returns(bool _isValid, bool _isCanceled, bool _isInvalidAndVoted){
        return (isValid, isCanceled, isInvalidAndVoted);
    }
    
    /* Function Modifiers */
    modifier isCoordinator(){
        require(msg.sender == coordinator, "You must be the event coorindator!");
        _;
    }
    
    modifier notCoordinator(){
        require(msg.sender != coordinator, "You cannot be the event coordinator!");
        _;
    }
    
    modifier notRunning() {
        require(block.timestamp < startDate, "This event has already started!");
        _;
    }
    
    modifier notCanceled() {
        require(isCanceled == false, "This event has already been canceled!");
        _;
    }
}