import axios from "axios"

export async function subgraphQuery(query) {
    try {
        const SUBGRAPH_URL = "https://api.thegraph.com/subgraphs/name/kemah-w3/random-winner-game"
        const response = await axios.post(SUBGRAPH_URL, {
            query
        })
        if(response.data.error) {
            console.error(response.data.error)
            throw new error(`Error making subgraph query ${response.data.error}`)
        }
        return (response.data.data)
    } catch (error) {
        console.error(error)
        throw new Error(`Could not query the subgraph ${error.message}`)
    }
}