This directory contains stored procedures for CosmosDB that implement
Replicache's push() and pull() operations.

It is *required* for correctness to implement push() as a stored proc so that
the `lastMutationID` and mutations happen atomically. Pull could be implemented
in application code, but since push is the more complex of the two, we have
implemented both as stored procs for consistency.

Sadly, CosmosDB's JS environment is quite impoverished and there are several
caveats to be aware of:

* The core API for the JS that runs inside stored procs (which CosmosDB
  confusingly calls "server-side JavaScript") is not Promise-based, which makes
  it very difficult to work with. We have minimally wrapped it in cosmos.js. It
  looks like there are also some open source projects that take this idea
  further, but require bundling.
* Stored procedures don't support es6 import/export, or even cjs require(). The
  only way to share code is by concatenation. Lol. See db.js's
  registerStoredProcedures().
* The main entry point function for a stored procedure is assumed to be the
  first function in source code order. WTF. So make sure you keep that in mind
  when updating the files in procs/.

We recommend that customers who want to use CosmosDB invest some effort into
getting a build phase setup so that full modern JS/TS features can be used and
these caveats don't need to be remembered by dev teams.
