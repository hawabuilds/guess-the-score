// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract ScorePayout {
    // ----------------------------- Roles --------------------------------
    address public owner;     // admin
    address public operator;  // opens/funds epochs
    address public signer;    // signs claim vouchers. MOST CRITICAL KEY.

    bool public paused;

    // ----------------------------- Epochs -------------------------------
    struct Epoch {
        uint256 pot;         // BNB allocated to this epoch
        uint256 claimedSum;  // BNB already claimed from this epoch
        bool open;           // operator opened it
    }
    mapping(uint256 => Epoch) public epochs;

    // voucherId => used? (prevents replay / double-claim)
    mapping(bytes32 => bool) public voucherUsed;

    uint256 public totalReserved; // sum of (pot - claimedSum) across epochs
    uint256 public latestEpochId;

    // ----------------------------- Events -------------------------------
    event Funded(address indexed from, uint256 amount);
    event EpochOpened(uint256 indexed epochId, uint256 pot);
    event Claimed(uint256 indexed epochId, bytes32 indexed voucherId, address indexed to, uint256 amount);
    event SignerChanged(address indexed oldS, address indexed newS);
    event OperatorChanged(address indexed oldO, address indexed newO);
    event PausedSet(bool paused);

    // ----------------------------- Modifiers ----------------------------
    modifier onlyOwner()    { require(msg.sender == owner, "not owner"); _; }
    modifier onlyOperator() { require(msg.sender == operator, "not operator"); _; }
    modifier notPaused()    { require(!paused, "paused"); _; }

    uint256 private _lock = 1;
    modifier nonReentrant() { require(_lock == 1, "reentrant"); _lock = 2; _; _lock = 1; }

    // ----------------------------- Constructor --------------------------
    constructor(address _operator, address _signer) {
        require(_operator != address(0), "operator=0");
        require(_signer != address(0), "signer=0");
        owner = msg.sender;
        operator = _operator;
        signer = _signer;
    }

    // ----------------------------- Funding ------------------------------
    function fund() external payable { require(msg.value > 0, "no value"); emit Funded(msg.sender, msg.value); }
    receive() external payable { emit Funded(msg.sender, msg.value); }

    // ----------------------------- Epoch open ---------------------------
    function openEpoch(uint256 epochId, uint256 pot) external onlyOperator notPaused {
        require(epochId > latestEpochId, "epochId not increasing");
        require(!epochs[epochId].open, "epoch exists");
        require(pot > 0, "pot=0");
        require(address(this).balance >= totalReserved + pot, "insufficient BNB held");

        epochs[epochId] = Epoch({ pot: pot, claimedSum: 0, open: true });
        totalReserved += pot;
        latestEpochId = epochId;
        emit EpochOpened(epochId, pot);
    }

    // ----------------------------- Claiming -----------------------------
    function claim(
        uint256 epochId,
        address to,
        uint256 amount,
        bytes32 voucherId,
        bytes calldata sig
    ) external nonReentrant notPaused {
        require(epochs[epochId].open, "epoch not open");
        require(to != address(0), "to=0");
        require(amount > 0, "amount=0");
        require(!voucherUsed[voucherId], "voucher used");

        bytes32 digest = _voucherDigest(epochId, to, amount, voucherId);
        require(_recover(digest, sig) == signer, "bad signature");

        Epoch storage e = epochs[epochId];
        require(e.claimedSum + amount <= e.pot, "exceeds epoch pot");

        voucherUsed[voucherId] = true;
        e.claimedSum += amount;
        totalReserved -= amount;

        (bool ok, ) = to.call{value: amount}("");
        require(ok, "BNB transfer failed");

        emit Claimed(epochId, voucherId, to, amount);
    }

    function _voucherDigest(
        uint256 epochId,
        address to,
        uint256 amount,
        bytes32 voucherId
    ) internal view returns (bytes32) {
        bytes32 inner = keccak256(
            abi.encodePacked(address(this), block.chainid, epochId, to, amount, voucherId)
        );
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", inner));
    }

    function _recover(bytes32 digest, bytes calldata sig) internal pure returns (address) {
        require(sig.length == 65, "bad sig len");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "bad v");
        require(uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0, "bad s");
        address a = ecrecover(digest, v, r, s);
        require(a != address(0), "ecrecover=0");
        return a;
    }

    // ----------------------------- Admin --------------------------------
    function setSigner(address newS) external onlyOwner {
        require(newS != address(0), "signer=0");
        emit SignerChanged(signer, newS);
        signer = newS;
    }
    function setOperator(address newO) external onlyOwner {
        require(newO != address(0), "operator=0");
        emit OperatorChanged(operator, newO);
        operator = newO;
    }
    function setPaused(bool p) external onlyOwner { paused = p; emit PausedSet(p); }

    function rescueUnreserved(address payable to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "to=0");
        uint256 free = address(this).balance - totalReserved;
        require(amount <= free, "exceeds unreserved");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "rescue failed");
    }

    // ----------------------------- Views --------------------------------
    function epochRemaining(uint256 epochId) external view returns (uint256) {
        Epoch storage e = epochs[epochId];
        return e.pot - e.claimedSum;
    }
}
