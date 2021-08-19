export const convertEpochToDate = (epoch) => {
  var myDate = new Date(epoch * 1000);
  return myDate.toLocaleString();
};
