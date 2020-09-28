let e = {}
e.loglevel = process.env.HP_LOG_LEVEL || 'info';
e.caseMongoConnection = process.env.MONGO_APPCENTER_URL || 'mongodb://127.0.0.1:29863';
e.caseMonogoDB =process.env.MONGO_DB || "appveen-FileNet";
e.caseSatus=process.env.CASE_STATUS || "Closed";
e.casesLimit = process.env.CASE_LIMIT || "100";
e.hostIp=process.env.HOST_IP || "15.206.132.48";
e.hostPort=process.env.HOST_PORT || "22";
e.hostUsername=process.env.HOST_USERNAME || "ubuntu";
e.hostPassword =process.env.HOST_PASSWORD || "ubuntu";
e.hostPath =process.env.HOST_PATH || "/home/ubuntu";
e.bucketName= process.env.BUCKET_NAME ||'caseDocuments'
e.loggerName = isK8sEnv() ? `[${process.env.QL_NAMESPACE}] [${process.env.HOSTNAME}] [FILE-NET]` : '[FILE-NET]';
function isK8sEnv() {
    return process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT && process.env.ODPENV == 'K8s';
}

module.exports = e;