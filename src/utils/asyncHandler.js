// higher order function to handle async errors in express routes
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next))
    .catch((err) => next(err));
    // this code can be replaced with try and catch block 
  };
};

export default asyncHandler;