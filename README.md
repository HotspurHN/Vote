Rinkeby contract example: https://rinkeby.etherscan.io/address/0x44688748bF9Dff5eFc0537FdA0f165BAe68022c7

Tasks:
```
npx hardhat addVoting --candidates 0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199,0xdd2fd4581271e230360230f9337d5c0430bf44c0 --network rinkeby

npx hardhat withdraw --network rinkeby

npx hardhat getVoting --votingid 100 --network rinkeby

npx hardhat finish --votingid 0 --network rinkeby

npx hardhat vote --votingid 0 --candidateid 0 --network rinkeby
```

`.env` constants
```
PRIVATE_KEY=""
ALCHEMY_API_KEY=""
CONTRACT=""
```