import fs from "fs";
import crypto from "crypto";

const badbits = {};
const data = JSON.parse(fs.readFileSync("/etc/nginx/denylist.json"));
data.forEach((entry) => (badbits[entry.anchor] = true));

const ipfsRegex = /^\/ipfs\/(\w+)(\/?.*)/;

// TODO implement matching CID paths
// TODO convert CID v0 to CID v1
// implementation ref: https://github.com/protocol/bifrost-infra/blob/af46340bd830728b38a0ea632ca517d04277f78c/ansible/roles/nginx_conf_denylist/files/lua/helpers.lua#L80
export default function filterCID(req) {
  const vars = req.variables;
  const matches = vars.cid_path.match(ipfsRegex);
  if (!matches) {
    return req.return(200);
  }

  const cid = matches[1];
  // check if root hash(`CID/`) is blocked via denylist.json
  const hashedCID = crypto
    .createHash("sha256")
    .update(cid + "/")
    .digest("hex");

  if (badbits[hashedCID]) {
    req.return(403);
  } else {
    req.return(200);
  }
}
