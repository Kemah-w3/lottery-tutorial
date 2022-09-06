//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";


contract RandomWinnerGame is VRFConsumerBase, Ownable {
    //chainlink variables 

    //amount of chainlink for fees
    uint256 public fee;

    //ID of public key against which randomness is generated
    bytes32 public keyHash;

    //address of the players
    address[] public players;

    //max number of players
    uint8 public maxPlayers;

    //state of the game
    bool public gameStarted;

    //fee to enter the game 
    uint256 public entryFee;

    //current game Id
    uint256 public gameId;

    //emitted when game starts
    event GameStarted(uint256 gameId, uint8 maxPlayers, uint256 entryFee);

    //emitted when player joins the game
    event PlayerJoined(uint256 gameId, address player);

    //emitted when game ends
    event GameEnded(uint256 gameId, address winner, bytes32 requestId);


    /**

    *vrfCoordinator is address of VRFCoordinator contract
    *linkToken is address of LINK token contract

     */
    constructor(address vrfCoordinator, address linkToken,
    bytes32 vrfKeyHash, uint256 vrfFee) 
    VRFConsumerBase(vrfCoordinator, linkToken) {
        fee = vrfFee;
        keyHash = vrfKeyHash;
        gameStarted = false;
    }

    //function to start the game
    function startGame(uint8 _maxPlayers, uint256 _entryFee) public onlyOwner {
        require(!gameStarted, "Game is currently running");

        //empty the array of players 
        delete players;

        maxPlayers = _maxPlayers;
        gameStarted = true;
        entryFee = _entryFee;
        gameId += 1;

        emit GameStarted(gameId, maxPlayers, entryFee);
    }

    //function to join game
    function joinGame() public payable {
        require(gameStarted, "Game has ended!");
        require(msg.value == entryFee, "Value sent is not equal to entry fee");
        require(players.length < maxPlayers, "Game is full!");

        //add players address to array of players
        players.push(msg.sender);
        emit PlayerJoined(gameId, msg.sender);

        //Get winner is game is full
        if(players.length == maxPlayers) {
            getRandomWinner();
        }
    }

    //fulfillRandomness is called by the VRFCoordinator when it receives a valid proof
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal virtual override {
        //modify random number to be in the range of 0 to players.length-1
        uint256 winnerIndex = randomness % players.length;
        //get winner from array of winners using winnerIndex
        address winner = players[winnerIndex];

        //transfer the balance of the smart contract to the winner
        (bool sent, ) = winner.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether!");

        emit GameEnded(gameId, winner, requestId);

        gameStarted = false;
    }

    //function to begin selection of a random winner
    function getRandomWinner() private returns(bytes32 requestId) {
        //LINK is an internal interface for link token found within the VRFConsumerBase contract
        //balanceOf is a method of that interface

        //check that our contract has enough link token for fees
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK for gas");

        //call requestRandomness function found within the VRFConsumerBase contract
        //to begin the process of getting a random number

        return requestRandomness(keyHash, fee);
    }

    //called when msg.data is empty
    receive() external payable{}

    //called when msg.data is not empty
    fallback() external payable{}

}