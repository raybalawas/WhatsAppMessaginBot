const MessageDone = async (req, res) => {
  console.log("woking");
  return res.json({
    Message: "working",
  });
};

export { MessageDone };
