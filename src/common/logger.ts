import moment from 'moment'

const makeTimestamp = () => moment().format('YYYY-MM-DD HH:mm:ss');

function log(tag: string, message: string) {
    console.log(`${makeTimestamp()} [${tag}] ${message}`);
}

function error(tag: string, message: string, error: any) {
    console.error(`${makeTimestamp()} ERROR [${tag}] ${message}`);
}

export default {
    log,
    error
}