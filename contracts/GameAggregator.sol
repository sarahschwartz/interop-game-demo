//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.21;

import { L2MessageVerification } from "./utils/L2MessageVerification.sol";
import {L2Message} from "./utils/Messaging.sol";

contract GameAggregator {
    struct HighScore {
        uint256 score;
        address player;
    }

    // mapping of chainId to (high score, player address)
    mapping(uint256 => HighScore) public highestScores;

    address constant L2_MESSAGE_VERIFICATION_ADDRESS =
        0x0000000000000000000000000000000000010009;

    L2MessageVerification public l2MessageVerifier =
        L2MessageVerification(L2_MESSAGE_VERIFICATION_ADDRESS);

    function proveScore(
        uint256 _sourceChainId,
        uint256 _l1BatchNumber,
        uint256 _l1BatchTxIndex,
        L2Message calldata _l2Message,
        bytes32[] calldata _proof
    ) public view returns (bool) {
        bool result = l2MessageVerifier.proveL2MessageInclusionShared(
            _sourceChainId,
            _l1BatchNumber,
            _l1BatchTxIndex,
            _l2Message,
            _proof
        );
        // require(result == true);
        return result;
    }
}
