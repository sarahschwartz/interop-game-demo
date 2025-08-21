//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.21;

import {L2MessageVerification} from "./utils/L2MessageVerification.sol";
import {L2Message} from "./utils/Messaging.sol";

contract GameAggregator {
    struct HighScore {
        uint256 score;
        address player;
    }

    // mapping of chainId to (high score, player address)
    mapping(uint256 => HighScore) public highestScores;

    uint256 public highestScore;
    uint256 public winningChainId;

    // mapping of approved Game contracts by chainId
    mapping(uint256 => address) public approvedGameByChain;

    address constant L2_MESSAGE_VERIFICATION_ADDRESS =
        0x0000000000000000000000000000000000010009;

    L2MessageVerification public l2MessageVerifier =
        L2MessageVerification(L2_MESSAGE_VERIFICATION_ADDRESS);

    constructor(uint256[] memory chainIds, address[] memory games) {
        require(chainIds.length == games.length, "length mismatch");
        for (uint256 i = 0; i < chainIds.length; ++i) {
            require(games[i] != address(0), "zero addr");
            require(
                approvedGameByChain[chainIds[i]] == address(0),
                "already set"
            );
            approvedGameByChain[chainIds[i]] = games[i];
        }
    }

    function proveScore(
        uint256 _sourceChainId,
        uint256 _l1BatchNumber,
        uint256 _l1BatchTxIndex,
        L2Message calldata _l2Message,
        bytes32[] calldata _proof
    ) public {
        require(
            approvedGameByChain[_sourceChainId] == _l2Message.sender,
            "Message sender not approved"
        );
        bool result = checkVerifyScore(
            _sourceChainId,
            _l1BatchNumber,
            _l1BatchTxIndex,
            _l2Message,
            _proof
        );
        require(result == true, "Message not verified");
        HighScore memory newScore = decodePacked(_l2Message.data);
        require(
            highestScores[_sourceChainId].score < newScore.score,
            "New score is not higher"
        );
        highestScores[_sourceChainId] = newScore;
        if (highestScore < newScore.score) {
            highestScore = newScore.score;
            winningChainId = _sourceChainId;
        }
    }

    function checkVerifyScore(
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
        return result;
    }

    function decodePacked(
        bytes calldata packed
    ) public pure returns (HighScore memory hs) {
        require(packed.length == 20 + 32, "bad len");
        (address addr, uint256 score) = abi.decode(
            bytes.concat(bytes12(0), packed),
            (address, uint256)
        );
        hs = HighScore({score: score, player: addr});
    }
}
