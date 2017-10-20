import { connect } from 'react-redux'
import ScoreBoard from '../components/Layout'
import selector from './selector'

class ScoreBoard extends Reac.Component {
    
    constructor(props) {
        super(props);
    }
    
    componentDidMount() {
        
    }

    render() {
        const { data, myPosition, containsAccount } = this.props;

        return <Layout data={ data } myPosition={ myPosition } containsAccount={ containsAccount } />
    }
}

export default connect(selector)(ScoreBoard)
