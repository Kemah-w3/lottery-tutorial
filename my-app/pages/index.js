import Head from "next/head"
import React, { useState, useEffect, useRef } from "react"
import styles from "../styles/Home.module.css"
import { subgraphQuery } from "../utils"
import { FETCH_CREATED_GAME } from "../queries"
import { abi, RANDOM_WINNER_GAME_CONTRACT_ADDRESS } from "../constants"
import { BigNumber, Contract, providers, utils, ethers } from "ethers"
import Web3Modal from "web3modal"

export default function Home() {
  const zero = BigNumber.from("0")
  const [loading, setLoading] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [entryFee, setEntryFee] = useState(zero)
  const [maxPlayers, setMaxPlayers] = useState(0)
  const [winner, setWinner] = useState("")
  const [logs, setLogs] = useState([])
  const [gameStarted, setGameStarted] = useState(false)
  const [players, setPlayers] = useState([])
  const web3ModalRef = useRef()

  const forceUpdate = React.useReducer(() =>({}),{})[1]

  const connectWallet = async () => {
    try {
      await getProviderOrSigner()
      setWalletConnected(true)
    } catch (error) {
      console.error(error)
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect()
    const web3Provider = new providers.Web3Provider(provider)
    const { chainId } = await web3Provider.getNetwork()

    if(chainId != 80001) {
      window.alert("change the network to mumbai")
      throw new Error("change the network to mumbai")
    }

    if(needSigner) {
      const signer = web3Provider.getSigner()
      return signer
    }
    return web3Provider
  }

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner()
      const gameContract = new Contract(
        RANDOM_WINNER_GAME_CONTRACT_ADDRESS,
        abi,
        provider
      )
      const _owner = await gameContract.owner()
      const signer = await getProviderOrSigner(true)
      const _address =  await signer.getAddress()

      if(_address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true)
      }
    } catch (error) {
      console.error(error.message)
    }
  }

  const checkIfGameStarted = async () => {
    try {
      const provider = await getProviderOrSigner()
      const gameContract = new Contract(
        RANDOM_WINNER_GAME_CONTRACT_ADDRESS,
        abi,
        provider
      )

      const _gameStarted = await gameContract.gameStarted()
      const _gameArray = await subgraphQuery(FETCH_CREATED_GAME())
      const _game = await _gameArray.games[0]
      let _logs = []

      if(_gameStarted) {
        _logs = [`Game has started with ID: ${_game.id}`]
        if(_game.players && _game.players.length > 0) {
          _logs.push(`${_game.players.length} / ${_game.maxPlayers} already joined the game 👀`)
          _game.players.forEach((player) => {
            _logs.push(`${player} joined the game 🏃‍♂️`)
          })
        } 
        setEntryFee(BigNumber.from(_game.entryFee))
        setMaxPlayers(_game.maxPlayers)
      } else if (!_gameStarted && _game.winner) {
        _logs = [
          `The Last game with game-ID: ${_game.id}, has ended`,
          `The winner is: ${_game.winner} 🎉`,
          `Waiting for the host to start a new`
        ]
        setWinner(_game.winner)
      }
      setLogs(_logs)
      setPlayers(_game.players)
      setGameStarted(_gameStarted)
      forceUpdate()
      
    } catch (error) {
      console.error(error)
    }
  }

  const joinGame = async () => {
    try {
      const signer = await getProviderOrSigner(true)
      const gameContract = new Contract(
        RANDOM_WINNER_GAME_CONTRACT_ADDRESS,
        abi,
        signer
      )
      
      setLoading(true)
      const tx = await gameContract.joinGame({
        value: entryFee
      })
      await tx.wait()
      setLoading(false)

    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const startGame = async () => {
    try {
      const signer = await getProviderOrSigner(true)
      const gameContract = new Contract(
        RANDOM_WINNER_GAME_CONTRACT_ADDRESS,
        abi,
        signer
      )
      setLoading(true)
      const tx = await gameContract.startGame(maxPlayers, entryFee)
      await tx.wait()
      setLoading(false)

    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if(!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "mumbai",
        providerOptions: {},
        disableInjectedProvider: false
      })
    }
    connectWallet()
    getOwner()
    checkIfGameStarted()
    setInterval(() => {
      checkIfGameStarted()
    }, 2000)
  }, [walletConnected])

  const renderButton = () => {
    if(!walletConnected) {
      return(
        <button className={styles.button} onClick={connectWallet}>
          Connect Wallet
        </button>
      )
    }

    if(loading) {
      return(
        <button className={styles.button}>
          Loading... please wait!
        </button>
      )
    }

    if(gameStarted) {
      if(players.length === maxPlayers) {
        return(
          <button className={styles.button} disabled>
            Choosing winner...
          </button>
        )
      }
      return(
        <button className={styles.button} onClick={joinGame}>
          Join Game 🚀
        </button>
      )
    }

    if(isOwner && !gameStarted) {
      return(
        <div>
          <input
            type="number"
            className={styles.input}
            onChange={(e) => {
              // The user will enter the value in ether, we will need to convert
              // it to WEI using parseEther
              setEntryFee(
                e.target.value >= 0 
                ? utils.parseEther(e.target.value.toString())
                : zero
              )
            }}
            placeholder="Entry Fee ETH"
          />

          <input
            type="number"
            className={styles.input}
            onChange={(e) => {
              //?? is a nullish coalescing operator that returns "0" if 
              //"e.target.value is undefined""
              setMaxPlayers(e.target.value ?? 0)
            }}
            placeholder="Max players"
          />

          <button className={styles.button} onClick={startGame}>
            Start Game 🚀
          </button>
        </div>
      )
    }
  }

  return (
    <div>
      <Head>
        <title>Random-Winner-Game dApp</title>
        <meta name="description" content="Random-Winner-Game dApp"/>
        <link rel="icon" href="./favicon.ico"/>
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>
            Welcome to Random Winner Game!
          </h1>
          <div className={styles.description}>
            Its a lottery game where a winner is chosen at random and wins the
            entire lottery pool
          </div>
          {renderButton()} 
          {/* conditional rendering of each item in log array using .map method */}
          {logs && 
            logs.map((log, index) => (
              <div className={styles.log} key={index}>
                {log}
              </div>
            ))
          }
        </div>
        <div>
          <img className={styles.image} src="./randomWinner.png" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by kemah.eth
      </footer>
    </div>
  )
}