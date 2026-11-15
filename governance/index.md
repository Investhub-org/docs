# Governance on-chain (run it yourself)

An issuer can run a general meeting on contracts they deploy and own. Those meetings keep working if InvestHub disappears. InvestHub has no admin rights on them.

The contracts are in the [Investhub-org/Governance](https://github.com/Investhub-org/Governance) repository. Read that README before deploying anything. In short, the repository is:

- an OpenZeppelin Governor, a timelock, an ERC20Votes share, and a Merkle dividend
- a CREATE2 factory and an ownerless directory
- deployed by the issuer, who owns the contracts

The contracts are unaudited.

Agents that only need to read a meeting or prepare an unsigned vote, delegation, or wrap can use the MCP tools on [Agents & MCP](/agents/mcp). Those tools still require Sign-In with Ethereum and a human signature. They are a client of these contracts, not an owner of them.

::: warning Not investment advice
This is not an offer and not investment advice. Offerings are offered via a licensed partner (in review). InvestHub does not hold an ECSP licence.
:::
