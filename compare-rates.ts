import { RpcProvider, Contract } from "starknet";
import { fetchCallReadOnlyFunction, cvToValue, Cl } from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";

const STARKNET_SWAP_ABI = [ { type: "interface", name: "ISwap", items: [ { type: "function", name: "get_rate", inputs: [ { name: "token_from", type: "core::starknet::contract_address::ContractAddress" }, { name: "token_to", type: "core::starknet::contract_address::ContractAddress" } ], outputs: [{ type: "core::integer::u256" }], state_mutability: "view" } ] } ];
async function main() {
    console.log("Fetching Stacks rate...");
    const rateResponse = await fetchCallReadOnlyFunction({
        contractAddress: "ST2TG1W441N7S1B11DR20Q4B3D2S6W086BDPFMGG5",
        contractName: "adam-swap",
        functionName: "get-rate",
        functionArgs: [
            Cl.contractPrincipal("ST2TG1W441N7S1B11DR20Q4B3D2S6W086BDPFMGG5", "usdcx-v3"),
            Cl.contractPrincipal("ST2TG1W441N7S1B11DR20Q4B3D2S6W086BDPFMGG5", "adam-token-adusd-v2")
        ],
        network: STACKS_TESTNET,
        senderAddress: "ST2TG1W441N7S1B11DR20Q4B3D2S6W086BDPFMGG5"
    });
    console.log("Stacks rate:", cvToValue(rateResponse).value);

    // Starknet
    console.log("Fetching Starknet rate...");
    const snProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io" });
    const snContract = new Contract(STARKNET_SWAP_ABI, "0x00f13d80a13ba0cbf373a628cfb04eb89da0344b1c8a164c8dcd981d36d4dfba", snProvider);
    const snRate = await snContract.call("get_rate", ["0x054e26eecdf624718f1de252a674d8900f78b00b4c7656537e6030150db5f02c", "0x067d4437b253839c88b7a3cf6a530e767acfbc6a40ccfa52a02c3e1604779a2d"]);
    console.log("Starknet rate:", snRate);
}
main().catch(console.error);
