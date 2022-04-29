//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Vote is Ownable {
    struct Voting {
        bool isOpen;
        address[] candidates;
        uint256[] votes;
        uint256 lockTime;
        uint256 deposits;
    }
    struct Winners {
        address payable[] candidates;
        uint256 count;
    }

    event VotingCreated(uint256 id);
    event VotingFinished(uint256 id);
    event VotingWon(uint256 id, address winner, uint256 amount);
    event Voted(uint256 votingId, uint256 candidate);
    event Withdrawed(uint256 amount);

    mapping(address => mapping(uint256 => bool)) private votes;
    Voting[] private votings;

    uint256 private votingDelay;
    uint256 private depositAmount;
    uint256 private taxAmount;
    uint256 private availableForWithdrawal;

    constructor(
        uint256 _votingDelay,
        uint256 _depositAmount,
        uint256 _taxAmount
    ) {
        votingDelay = _votingDelay;
        depositAmount = _depositAmount;
        taxAmount = _taxAmount;
    }

    function addVoting(address[] memory _candidates) public onlyOwner {
        Voting memory voting = Voting({
            isOpen: true,
            candidates: _candidates,
            votes: new uint256[](_candidates.length),
            lockTime: block.timestamp + votingDelay,
            deposits: 0
        });
        votings.push(voting);
        emit VotingCreated(votings.length - 1);
    }

    function finish(uint256 _votingIndex) public onlyOwner {
        require(_votingIndex < votings.length, "Invalid voting index");
        require(votings[_votingIndex].isOpen, "Voting is not open");
        require(
            block.timestamp >= votings[_votingIndex].lockTime,
            "Voting is not finished yet"
        );

        Voting storage voting = votings[_votingIndex];
        voting.isOpen = false;
        uint256 max = getMax(voting.votes);
        Winners memory winners = findElementsInArray(
            max,
            voting.votes,
            voting.candidates
        );
        uint256 prizeValue = (voting.deposits * (100 - taxAmount)) /
            (winners.count * 100);
        for (uint256 i = 0; i < winners.count; i++) {
            winners.candidates[i].transfer(prizeValue);
            voting.deposits -= prizeValue;
            emit VotingWon(_votingIndex, winners.candidates[i], prizeValue);
        }
        availableForWithdrawal += voting.deposits;
        voting.deposits = 0;
        emit VotingFinished(_votingIndex);
    }

    function getVoting(uint256 _votingIndex)
        public
        view
        returns (Voting memory)
    {
        require(_votingIndex < votings.length, "Invalid voting index");
        Voting memory voting = votings[_votingIndex];
        return voting;
    }

    function vote(uint256 _vote, uint256 _candidate) public payable {
        require(
            msg.value == depositAmount,
            string(
                abi.encodePacked(
                    "You must deposit ",
                    Strings.toString(depositAmount),
                    " wei to vote"
                )
            )
        );
        require(votes[msg.sender][_vote] == false, "You have already voted");
        require(votings[_vote].isOpen, "Voting is closed");
        require(
            votings[_vote].lockTime > block.timestamp,
            "Voting is outdated"
        );

        votes[msg.sender][_vote] = true;
        votings[_vote].votes[_candidate]++;
        votings[_vote].deposits += msg.value;
        emit Voted(_vote, _candidate);
    }

    function withdraw() public payable onlyOwner {
        require(availableForWithdrawal > 0, "No funds to withdraw");
        payable(msg.sender).transfer(availableForWithdrawal);
        emit Withdrawed(availableForWithdrawal);
        availableForWithdrawal = 0;
    }

    function findElementsInArray(
        uint256 element,
        uint256[] memory arr,
        address[] memory addresses
    ) private pure returns (Winners memory) {
        address payable[] memory result = new address payable[](arr.length);
        uint256 i = 0;
        for (uint256 j = 0; j < arr.length; j++) {
            if (arr[j] == element) {
                result[i] = payable(addresses[j]);
                i++;
            }
        }
        return Winners(result, i);
    }

    function getMax(uint256[] memory arr) private pure returns (uint256) {
        uint256 largest = 0;
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] > largest) {
                largest = arr[i];
            }
        }
        return largest;
    }
}
