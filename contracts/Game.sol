//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.21;
import {IL1Messenger} from "@matterlabs/zksync-contracts/contracts/system-contracts/interfaces/IL1Messenger.sol";

contract Game {
    uint256 public highestScore;
    address constant L2_TO_L1_MESSENGER_SYSTEM_CONTRACT_ADDR =
        0x0000000000000000000000000000000000008008;
    IL1Messenger public L1Messenger =
        IL1Messenger(L2_TO_L1_MESSENGER_SYSTEM_CONTRACT_ADDR);
    bytes public lastSentMessage;

    // mapping to store player scores
    mapping(address => uint256) public scores;

    constructor() {
        highestScore = 20;
    }

    function incrementScore() public {
        scores[msg.sender]++;
        if (scores[msg.sender] > highestScore) {
            highestScore = scores[msg.sender];
            // Broadcast the new high score to L1
            broadcastHighScore(msg.sender, highestScore);
        }
    }

    function broadcastHighScore(address _player, uint256 _highscore) internal {
        bytes memory message = abi.encodePacked(_player, _highscore);
        lastSentMessage = message;
        L1Messenger.sendToL1(message);
    }
}