import React, { useEffect, useRef, useState } from "react";
import { Replicache } from "replicache";
import { useSubscribe } from "replicache-react-util";
import Pusher from "pusher-js";

export default function Home() {
  const [rep, setRep] = useState(null);

  useEffect(async () => {
    const rep = new Replicache({
      pushURL: "/api/replicache-push",
      pullURL: "/api/replicache-pull",
      // The .dev.wasm version is nice during development because it has
      // symbols and additional debugging info. The .wasm version is smaller
      // and faster.
      wasmModule: "/replicache.dev.wasm",
      mutators,
    });
    listen(rep);
    setRep(rep);
  }, []);

  return rep && <Chat rep={rep} />;
}

/**
 * @param {{rep: Replicache<typeof mutators>}} props
 */
function Chat({ rep }) {
  const messages = useSubscribe(
    rep,
    async (tx) => {
      const list = await tx.scan({ prefix: "message/" }).entries().toArray();
      list.sort(([, { order: a }], [, { order: b }]) => a - b);
      return list;
    },
    []
  );

  const usernameRef = useRef();
  const contentRef = useRef();

  const onSubmit = (e) => {
    e.preventDefault();
    const last = messages.length && messages[messages.length - 1][1];
    const order = (last?.order ?? 0) + 1;
    rep.mutate.createMessage({
      // Easy unique ID. In a real app use a GUID.
      id: Math.random().toString(32).substr(2),
      from: usernameRef.current.value,
      content: contentRef.current.value,
      order,
    });
    contentRef.current.value = "";
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={onSubmit}>
        <input ref={usernameRef} style={styles.username} required />
        says:
        <input ref={contentRef} style={styles.content} required />
        <input type="submit" />
      </form>
      <MessageList messages={messages} />
    </div>
  );
}

function MessageList({ messages }) {
  return messages.map(([k, v]) => {
    return (
      <div key={k}>
        <b>{v.from}: </b>
        {v.content}
      </div>
    );
  });
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
  },
  form: {
    display: "flex",
    flexDirection: "row",
    flex: 0,
    marginBottom: "1em",
  },
  username: {
    flex: 0,
    marginRight: "1em",
  },
  content: {
    flex: 1,
    maxWidth: "30em",
    margin: "0 1em",
  },
};

const mutators = {
  async createMessage(tx, { id, from, content, order }) {
    await tx.put(`message/${id}`, {
      from,
      content,
      order,
    });
  },
};

function listen(rep) {
  // Listen for pokes, and pull whenever we get one.
  Pusher.logToConsole = true;
  const pusher = new Pusher(process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_REPLICHAT_PUSHER_CLUSTER,
  });
  const channel = pusher.subscribe("default");
  channel.bind("poke", () => {
    console.log("got poked");
    rep.pull();
  });
}
