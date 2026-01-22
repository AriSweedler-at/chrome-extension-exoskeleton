<div class="alert alert-danger"><div><h5>Exception </h5><div class="Markdown break-word"><p>Index -1 out of bounds for length 0</p>
<p>waitOnJobCompletion:</p>
<p>Internal Server Error</p>
<p>Index -1 out of bounds for length 0</p>
<p>Failed to evaluate [kubectl.kubernetes.io/last-applied-configuration] : {"apiVersion":"batch/v1","kind":"Job","metadata":{"annotations":{"artifact.spinnaker.io/location":"deploy","artifact.spinnaker.io/name":"h-bg-provision-step-0-5b8e-jqqt","artifact.spinnaker.io/type":"kubernetes/job","artifact.spinnaker.io/version":"","job.spinnaker.io/logs":"https://opensearch-applogs.shadowbox.cloud/_dashboards/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!f,value:15000),time:(from:now-6h,to:now))\u0026_a=(columns:!(msg,stream),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:airtable-applogs-index,key:kubernetes.job.name,negate:!f,params:(query:{{ manifest.metadata.name }}),type:phrase),query:(match_phrase:(kubernetes.job.name:{{ manifest.metadata.name }})))),index:airtable-applogs-index,interval:auto,query:(language:kuery,query:''),sort:!())","moniker.spinnaker.io/application":"hyperbase-deploy","moniker.spinnaker.io/cluster":"job h-bg-provision-step-0-5b8e-jqqt","strategy.spinnaker.io/recreate":"true"},"labels":{"app.kubernetes.io/managed-by":"spinnaker","app.kubernetes.io/name":"hyperbase-deploy"},"name":"h-bg-provision-step-0-5b8e-jqqt","namespace":"deploy"},"spec":{"activeDeadlineSeconds":7500,"backoffLimit":0,"template":{"metadata":{"annotations":{"artifact.spinnaker.io/location":"deploy","artifact.spinnaker.io/name":"h-bg-provision-step-0-5b8e-jqqt","artifact.spinnaker.io/type":"kubernetes/job","artifact.spinnaker.io/version":"","cluster-autoscaler.kubernetes.io/safe-to-evict":"false","co.elastic.logs/enabled":"true","co.elastic.logs/processors.1.rename.fields.0.from":"message","co.elastic.logs/processors.1.rename.fields.1.to":"msg","co.elastic.logs/processors.rename.fail_on_error":"true","co.elastic.logs/processors.rename.fields.0.from":"kubernetes.pod.name","co.elastic.logs/processors.rename.fields.1.to":"kubernetesPodName","moniker.spinnaker.io/application":"hyperbase-deploy","moniker.spinnaker.io/cluster":"job h-bg-provision-step-0-5b8e-jqqt"},"labels":{"app.kubernetes.io/managed-by":"spinnaker","app.kubernetes.io/name":"hyperbase-deploy","securityTier":"private"}},"spec":{"containers":[{"args":["/bin/bash","-c","set -x\nexport PATH=$PATH:~/h/bin\n\necho IMPORTING_CREDS_IN_PIPELINE | tee -a AIRTABLE_LOG_ROOT/deploy.log ;\nnode ./admin/bin/import_credentials_during_startup.js /var/h/deploy/airtable/current | tee -a AIRTABLE_LOG_ROOT/deploy.log\n    \n\nset -euo pipefail\n\ncd /var/h/deploy/airtable/current\n\n\n\ngrunt eks:container:installKubernetesTools;\n\ngrunt ops:automation:createAndSetupBlueGreenDeployments \\n    --stage=HYPERBASE_STAGE \\n    --region=AWS_REGION \\n    --sourceDbInstanceIdentifiers=SOURCE_DB_INSTANCE_IDENTIFIERS \\n    --targetMySQLVersion=TARGET_MYSQL_VERSION \\n    --targetPrimaryDbParamGroupName=TARGET_PRIMARY_PARAM_GROUP_NAME \\n    --targetSecondaryDbParamGroupName=TARGET_SECONDARY_PARAM_GROUP_NAME \\n    --targetPrimaryInstanceClass=TARGET_PRIMARY_INSTANCE_CLASS \\n    --targetSecondaryInstanceClass=TARGET_SECONDARY_INSTANCE_CLASS \\n    --skipGenerateTerraform=true \\n    | tee -a AIRTABLE_LOG_ROOT/deploy.log | ./bin/bunyan\n"],"env":[{"name":"RUN_ENVIRONMENT","value":"production"},{"name":"HYPERBASE_STAGE","value":"production"},{"name":"SPINNAKER_EXECUTION_ID","value":"01HPN64GE091GK831P0XG2JQQT"},{"name":"HYPERBASE_CODE_SHA","value":"65b8e40c04922924a1905e751b47b983d17062d6"},{"name":"SOURCE_DB_INSTANCE_IDENTIFIERS","value":"production-application-live-mysql8-010"},{"name":"TARGET_MYSQL_VERSION","value":"8.0.28"},{"name":"TARGET_PRIMARY_PARAM_GROUP_NAME","value":"airtable-mysql-8-production-application-live"},{"name":"TARGET_SECONDARY_PARAM_GROUP_NAME","value":"airtable-mysql-8-production-read-replica"},{"name":"TARGET_PRIMARY_INSTANCE_CLASS","value":"db.r6g.4xlarge"},{"name":"TARGET_SECONDARY_INSTANCE_CLASS","value":"db.r6g.large"},{"name":"AIRTABLE_LOG_ROOT","value":"/var/h/log/airtable"},{"name":"LOGGER_LOG_DIR","value":"/var/h/log/airtable/logger"},{"name":"CONTAINER_PLATFORM","value":"kubernetes"},{"name":"POD_NAME","valueFrom":{"fieldRef":{"fieldPath":"metadata.name"}}},{"name":"POD_NAMESPACE","valueFrom":{"fieldRef":{"fieldPath":"metadata.namespace"}}},{"name":"POD_UID","valueFrom":{"fieldRef":{"fieldPath":"metadata.uid"}}},{"name":"K8S_NODE_NAME","valueFrom":{"fieldRef":{"fieldPath":"spec.nodeName"}}},{"name":"STATSD_HOST_IP","valueFrom":{"fieldRef":{"fieldPath":"status.hostIP"}}},{"name":"PROXY_SQL_HOST_IP","valueFrom":{"fieldRef":{"fieldPath":"status.hostIP"}}},{"name":"ENVOY_HOST_IP","valueFrom":{"fieldRef":{"fieldPath":"status.hostIP"}}}],"image":"135966717476.dkr.ecr.us-east-1.amazonaws.com/hyperbase:65b8e40c04922924a1905e751b47b983d17062d6","name":"grunt-task","resources":{"requests":{"cpu":"500m","memory":"1Gi"}},"volumeMounts":[{"mountPath":"/var/h/log/airtable","name":"airtable-logs"},{"mountPath":"/var/run/secrets/eks_token_store","name":"eks-token-store"},{"mountPath":"/deploy_git_clone","name":"deploy-git-clone"}]}],"nodeSelector":{"networkTier":"private"},"restartPolicy":"Never","serviceAccountName":"rds-provisioning","volumes":[{"hostPath":{"path":"/var/h/log/airtable","type":"Directory"},"name":"airtable-logs"},{"emptyDir":{},"name":"eks-token-store"},{"emptyDir":{},"name":"deploy-git-clone"}]}},"ttlSecondsAfterFinished":2700}}
not found</p>
<p>Failed to evaluate [description] : Failed to evaluate set -x
export PATH=$PATH:~/h/bin</p>
<p>echo IMPORTING_CREDS_IN_PIPELINE | tee -a AIRTABLE_LOG_ROOT/deploy.log ;
node ./admin/bin/import_credentials_during_startup.js /var/h/deploy/airtable/current | tee -a AIRTABLE_LOG_ROOT/deploy.log</p>
<p>set -euo pipefail</p>
<p>cd /var/h/deploy/airtable/current</p>
<p>grunt eks:container:installKubernetesTools;</p>
<p>grunt ops:automation:createAndSetupBlueGreenDeployments <br>
--stage=HYPERBASE_STAGE <br>
--region=AWS_REGION <br>
--sourceDbInstanceIdentifiers=SOURCE_DB_INSTANCE_IDENTIFIERS <br>
--targetMySQLVersion=TARGET_MYSQL_VERSION <br>
--targetPrimaryDbParamGroupName=TARGET_PRIMARY_PARAM_GROUP_NAME <br>
--targetSecondaryDbParamGroupName=TARGET_SECONDARY_PARAM_GROUP_NAME <br>
--targetPrimaryInstanceClass=TARGET_PRIMARY_INSTANCE_CLASS <br>
--targetSecondaryInstanceClass=TARGET_SECONDARY_INSTANCE_CLASS <br>
--skipGenerateTerraform=true <br>
| tee -a AIRTABLE_LOG_ROOT/deploy.log | ./bin/bunyan
: set -x
export PATH=$PATH:~/h/bin</p>
<p>echo IMPORTING_CREDS_IN_PIPELINE | tee -a AIRTABLE_LOG_ROOT/deploy.log ;
node ./admin/bin/import_credentials_during_startup.js /var/h/deploy/airtable/current | tee -a AIRTABLE_LOG_ROOT/deploy.log</p>
<p>set -euo pipefail</p>
<p>cd /var/h/deploy/airtable/current</p>
<p>grunt eks:container:installKubernetesTools;</p>
<p>grunt ops:automation:createAndSetupBlueGreenDeployments <br>
--stage=HYPERBASE_STAGE <br>
--region=AWS_REGION <br>
--sourceDbInstanceIdentifiers=SOURCE_DB_INSTANCE_IDENTIFIERS <br>
--targetMySQLVersion=TARGET_MYSQL_VERSION <br>
--targetPrimaryDbParamGroupName=TARGET_PRIMARY_PARAM_GROUP_NAME <br>
--targetSecondaryDbParamGroupName=TARGET_SECONDARY_PARAM_GROUP_NAME <br>
--targetPrimaryInstanceClass=TARGET_PRIMARY_INSTANCE_CLASS <br>
--targetSecondaryInstanceClass=TARGET_SECONDARY_INSTANCE_CLASS <br>
--skipGenerateTerraform=true <br>
| tee -a AIRTABLE_LOG_ROOT/deploy.log | ./bin/bunyan
not found not found</p>
<p>Failed to evaluate set -x
export PATH=$PATH:~/h/bin</p>
<p>echo IMPORTING_CREDS_IN_PIPELINE | tee -a ${AIRTABLE_LOG_ROOT}/deploy.log ;
node ./admin/bin/import_credentials_during_startup.js /var/h/deploy/airtable/current | tee -a ${AIRTABLE_LOG_ROOT}/deploy.log</p>
<p>set -euo pipefail</p>
<p>cd /var/h/deploy/airtable/current</p>
<p>grunt eks:container:installKubernetesTools;</p>
<p>grunt ops:automation:createAndSetupBlueGreenDeployments <br>
--stage=${HYPERBASE_STAGE} <br>
--region=${AWS_REGION} <br>
--sourceDbInstanceIdentifiers=${SOURCE_DB_INSTANCE_IDENTIFIERS} <br>
--targetMySQLVersion=${TARGET_MYSQL_VERSION} <br>
--targetPrimaryDbParamGroupName=${TARGET_PRIMARY_PARAM_GROUP_NAME} <br>
--targetSecondaryDbParamGroupName=${TARGET_SECONDARY_PARAM_GROUP_NAME} <br>
--targetPrimaryInstanceClass=${TARGET_PRIMARY_INSTANCE_CLASS} <br>
--targetSecondaryInstanceClass=${TARGET_SECONDARY_INSTANCE_CLASS} <br>
--skipGenerateTerraform=true <br>
| tee -a ${AIRTABLE_LOG_ROOT}/deploy.log | ./bin/bunyan
: set -x
export PATH=$PATH:~/h/bin</p>
<p>echo IMPORTING_CREDS_IN_PIPELINE | tee -a AIRTABLE_LOG_ROOT/deploy.log ;
node ./admin/bin/import_credentials_during_startup.js /var/h/deploy/airtable/current | tee -a AIRTABLE_LOG_ROOT/deploy.log</p>
<p>set -euo pipefail</p>
<p>cd /var/h/deploy/airtable/current</p>
<p>grunt eks:container:installKubernetesTools;</p>
<p>grunt ops:automation:createAndSetupBlueGreenDeployments <br>
--stage=HYPERBASE_STAGE <br>
--region=AWS_REGION <br>
--sourceDbInstanceIdentifiers=SOURCE_DB_INSTANCE_IDENTIFIERS <br>
--targetMySQLVersion=TARGET_MYSQL_VERSION <br>
--targetPrimaryDbParamGroupName=TARGET_PRIMARY_PARAM_GROUP_NAME <br>
--targetSecondaryDbParamGroupName=TARGET_SECONDARY_PARAM_GROUP_NAME <br>
--targetPrimaryInstanceClass=TARGET_PRIMARY_INSTANCE_CLASS <br>
--targetSecondaryInstanceClass=TARGET_SECONDARY_INSTANCE_CLASS <br>
--skipGenerateTerraform=true <br>
| tee -a AIRTABLE_LOG_ROOT/deploy.log | ./bin/bunyan
not found</p>
</div></div></div>
