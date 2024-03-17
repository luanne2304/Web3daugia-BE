// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract Daugiacontract {

    address payable public beneficiary;
    uint public endtime;
    uint public highestBid;
    address public highestBidder;
    bool public ended= false;

    mapping(address=> uint) public pendingReturns;

    event updateHighestBid(address bidder , uint bid);
    event sessionWinner(address winner, uint bid);

    constructor (uint _biddingtime, address payable _beneficiary){
        beneficiary= _beneficiary;
        endtime= block.timestamp + _biddingtime;
    }

    function bid() public payable {
        if(block.timestamp> endtime){
            revert("phien da ket thuc");
        }
        if(msg.value <= highestBid){
            revert("Gia cua ban thap hon gia hien tai");
        }
        if(highestBid !=0){
            pendingReturns[highestBidder] = pendingReturns[highestBidder] + highestBid;
        }
        highestBidder=msg.sender;
        highestBid=msg.value;
        emit updateHighestBid(highestBidder, highestBid);
    }

    function withdraw() public returns(bool){
        uint amount = pendingReturns[msg.sender];
        if(amount >0){
            pendingReturns[msg.sender]=0;
            if(!payable(msg.sender).send(amount)){
                pendingReturns[msg.sender]=amount;
                return false;
            }
        }
        return true;
    }

    function sessionEnd() public {
        if(ended){
            revert("Phien da ket thuc");
        }
        if(block.timestamp < endtime){
            revert("Phien chua ket thuc");
        }
        ended = true;
        emit sessionWinner(highestBidder, highestBid);
        beneficiary.transfer(highestBid);
    }

}