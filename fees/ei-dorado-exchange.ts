import { Chain } from "@defillama/sdk/build/general";
import { gql, request } from "graphql-request";
import type { ChainEndpoints } from "../adapters/types";
import { Adapter } from "../adapters/types";
import { BSC } from "../helpers/chains";
import { getTimestampAtStartOfDayUTC } from "../utils/date";

const endpoints = {
    [BSC]: "https://api.thegraph.com/subgraphs/name/metaverseblock/ede_stats_elpall_test",
};

const graphs = (graphUrls: ChainEndpoints) => {
    return (chain: Chain) => {
        return async (timestamp: number) => {
            const todaysTimestamp = getTimestampAtStartOfDayUTC(timestamp);

            const graphQuery = gql`{
                feeStat(id: "${todaysTimestamp}",period: "daily") {
                    mint
                    burn
                    marginAndLiquidation
                    swap
                }
            }`;

            const graphRes = await request(graphUrls[chain], graphQuery);

            const dailyFee =
                parseInt(graphRes.feeStat.mint) +
                parseInt(graphRes.feeStat.burn) +
                parseInt(graphRes.feeStat.marginAndLiquidation) +
                parseInt(graphRes.feeStat.swap);
            const dailyUserFees = dailyFee / 1e30;

            return {
                timestamp,
                dailyUserFees: dailyUserFees.toString(),
                dailyRevenue: (dailyUserFees * 0.3).toString(),
            };
        };
    };
};

const adapter: Adapter = {
    adapter: {
        [BSC]: {
            fetch: graphs(endpoints)(BSC),
            start: async () => 1670659200,
            meta: {
                methodology: 'All mint, burn, marginAndLiquidation and swap fees are collected and the daily fee amount is determined. Daily revenue is calculated as 30% of the total fee.'
            }
        },
    },
};

export default adapter;
